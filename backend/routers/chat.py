import json
import os
import uuid
from datetime import date
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from audit import write_audit
from database import get_db

router = APIRouter(prefix="/chat", tags=["chat"])

_openai_client: Optional[OpenAI] = None


def _get_openai():
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key or api_key == "your_key_here":
            raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured.")
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_participation",
            "description": "Add a provider to a network. ONLY call this after the user has explicitly confirmed the action (said yes, go ahead, confirm, or similar). Never call without confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "provider_id": {"type": "string", "description": "e.g. P001"},
                    "network_code": {"type": "string", "enum": ["Medicare", "CCN", "COD", "Commercial PPO"]},
                    "agreement_id": {"type": "string", "description": "Must be a valid crosswalk agreement for this provider's group + network, e.g. AGR-G001-MCR"},
                    "effective_date": {"type": "string", "description": "YYYY-MM-DD format"},
                },
                "required": ["provider_id", "network_code", "agreement_id", "effective_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "terminate_participation",
            "description": "Terminate an active network participation. ONLY call this after the user has explicitly confirmed. Never call without confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "participation_id": {"type": "string", "description": "UUID of the participation record"},
                    "termination_date": {"type": "string", "description": "YYYY-MM-DD — must be on or after the participation's effective date"},
                },
                "required": ["participation_id", "termination_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_participation",
            "description": "Update an existing participation's agreement ID or effective date. ONLY call after the user has explicitly confirmed. Never call without confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "participation_id": {"type": "string", "description": "UUID of the participation record"},
                    "agreement_id": {"type": "string", "description": "New agreement ID (optional)"},
                    "effective_date": {"type": "string", "description": "New effective date YYYY-MM-DD (optional)"},
                },
                "required": ["participation_id"],
            },
        },
    },
]


def _execute_tool(name: str, args: dict, db: Session) -> str:
    """Execute a confirmed tool call against the database and return a result string."""
    if name == "add_participation":
        provider = db.query(models.Provider).filter(
            models.Provider.provider_id == args["provider_id"]).first()
        if not provider:
            return f"Error: Provider {args['provider_id']} not found."

        network = db.query(models.Network).filter(
            models.Network.network_code == args["network_code"]).first()
        if not network:
            return f"Error: Network {args['network_code']} not found."

        cw = db.query(models.Crosswalk).filter(
            models.Crosswalk.network_code == args["network_code"],
            models.Crosswalk.agreement_id == args["agreement_id"],
        ).first()
        if not cw:
            return f"Error: Agreement {args['agreement_id']} is not valid for network {args['network_code']}."

        active_groups = {
            a.group_id for a in
            db.query(models.ProviderGroupAffiliation).filter(
                models.ProviderGroupAffiliation.provider_id == args["provider_id"],
                models.ProviderGroupAffiliation.status == "Active",
            ).all()
        }
        if cw.group_id not in active_groups:
            return f"Error: Agreement {args['agreement_id']} belongs to a group the provider is not affiliated with."

        try:
            eff = date.fromisoformat(args["effective_date"])
        except ValueError:
            return "Error: effective_date must be in YYYY-MM-DD format."

        participation = models.ProviderParticipation(
            participation_id=str(uuid.uuid4()),
            provider_id=args["provider_id"],
            network_code=args["network_code"],
            agreement_id=args["agreement_id"],
            effective_date=eff,
            status="Active",
            source="API",
        )
        db.add(participation)
        db.commit()
        db.refresh(participation)

        write_audit(
            db, provider=provider, action_type="Add",
            network_code=args["network_code"], new_status="Active",
            source="API", agreement_id=args["agreement_id"],
            effective_date=eff,
            notes="Added via AI chat agent",
        )
        return (
            f"Done. {provider.provider_name} has been added to {args['network_code']} "
            f"(agreement {args['agreement_id']}, effective {args['effective_date']})."
        )

    elif name == "terminate_participation":
        participation = db.query(models.ProviderParticipation).filter(
            models.ProviderParticipation.participation_id == args["participation_id"]
        ).first()
        if not participation:
            return f"Error: Participation {args['participation_id']} not found."
        if participation.status == "Terminated":
            return "Error: This participation is already terminated."

        try:
            term_date = date.fromisoformat(args["termination_date"])
        except ValueError:
            return "Error: termination_date must be in YYYY-MM-DD format."

        if participation.effective_date and term_date < participation.effective_date:
            return (
                f"Error: Termination date ({args['termination_date']}) cannot be before "
                f"effective date ({participation.effective_date})."
            )

        provider = db.query(models.Provider).filter(
            models.Provider.provider_id == participation.provider_id).first()

        previous_status = participation.status
        participation.status = "Terminated"
        participation.termination_date = term_date
        participation.source = "API"
        db.commit()
        db.refresh(participation)

        write_audit(
            db, provider=provider, action_type="Terminate",
            network_code=participation.network_code, new_status="Terminated",
            source="API", agreement_id=participation.agreement_id,
            effective_date=participation.effective_date,
            termination_date=term_date, previous_status=previous_status,
            notes="Terminated via AI chat agent",
        )
        return (
            f"Done. {provider.provider_name}'s {participation.network_code} participation "
            f"has been terminated (effective {args['termination_date']})."
        )

    elif name == "update_participation":
        participation = db.query(models.ProviderParticipation).filter(
            models.ProviderParticipation.participation_id == args["participation_id"]
        ).first()
        if not participation:
            return f"Error: Participation {args['participation_id']} not found."

        provider = db.query(models.Provider).filter(
            models.Provider.provider_id == participation.provider_id).first()
        previous_status = participation.status
        changes = []

        if "agreement_id" in args and args["agreement_id"]:
            participation.agreement_id = args["agreement_id"]
            changes.append(f"agreement → {args['agreement_id']}")
        if "effective_date" in args and args["effective_date"]:
            try:
                participation.effective_date = date.fromisoformat(args["effective_date"])
                changes.append(f"effective_date → {args['effective_date']}")
            except ValueError:
                return "Error: effective_date must be in YYYY-MM-DD format."

        if not changes:
            return "No changes were specified."

        participation.source = "API"
        db.commit()
        db.refresh(participation)

        write_audit(
            db, provider=provider, action_type="Update",
            network_code=participation.network_code, new_status=participation.status,
            source="API", agreement_id=participation.agreement_id,
            effective_date=participation.effective_date,
            previous_status=previous_status,
            notes=f"Updated via AI chat agent: {'; '.join(changes)}",
        )
        return (
            f"Done. {provider.provider_name}'s {participation.network_code} participation "
            f"has been updated: {', '.join(changes)}."
        )

    return f"Error: Unknown tool '{name}'."


def _build_system_prompt(db: Session, context: dict) -> str:
    providers = db.query(models.Provider).order_by(models.Provider.provider_id).all()
    affiliations = (
        db.query(models.ProviderGroupAffiliation, models.Group)
        .join(models.Group, models.Group.group_id == models.ProviderGroupAffiliation.group_id)
        .all()
    )
    participations = db.query(models.ProviderParticipation).order_by(
        models.ProviderParticipation.provider_id).all()
    crosswalk = (
        db.query(models.Crosswalk, models.Group, models.Network)
        .join(models.Group, models.Group.group_id == models.Crosswalk.group_id)
        .join(models.Network, models.Network.network_code == models.Crosswalk.network_code)
        .all()
    )
    rules = db.query(models.NetworkEligibilityRule).order_by(
        models.NetworkEligibilityRule.rule_id).all()

    aff_by_provider: dict[str, list[str]] = {}
    for aff, group in affiliations:
        aff_by_provider.setdefault(aff.provider_id, []).append(
            f"{group.group_name} ({group.group_id})"
        )

    part_by_provider: dict[str, list[str]] = {}
    for p in participations:
        part_by_provider.setdefault(p.provider_id, []).append(
            f"{p.network_code} [{p.status}] agr={p.agreement_id or '—'}"
        )

    lines = [
        "You are a Provider Network Operations AI assistant for the Genzeon × UiPath demo system.",
        "Answer questions accurately using ONLY the data provided below. Be concise and specific.",
        "If asked about something not in the data, say you don't have that information.",
        "",
        "== ACTION RULES (CRITICAL — follow exactly) ==",
        "You have tools to add, terminate, and update participations.",
        "RULE 1: Before calling ANY tool, you MUST first describe what you plan to do and explicitly ask the user to confirm.",
        "RULE 2: Only call a tool AFTER the user has confirmed with words like 'yes', 'go ahead', 'confirm', 'proceed', 'do it', or similar.",
        "RULE 3: If the user has NOT confirmed, respond with a proposal only — do NOT call the tool.",
        "RULE 4: Before proposing an add action, check the eligibility rules in the data below. If the provider's specialty, credentialing, board certification, or county would cause a rule to fail (Exclude), say so and decline to proceed.",
        "RULE 5: When proposing an add action, always look up the correct agreement_id from the CROSSWALK section for this provider's group + the requested network.",
        "",
        "== DEMO SCENARIOS (Blues Connect UiPath demo) ==",
        "Scenario A — Network Add: Dr. John Smith (P001, NPI 1234567890). Currently has NO network participations. UiPath agent will add him to Medicare, CCN, and Commercial PPO via ABC Medical Group (G001) agreements. Expected result: High confidence, no exceptions, full eligibility approval.",
        "Scenario B — Network Update: Dr. Maria Lopez (P002, NPI 9876543210). Currently has Commercial PPO only. Has DUAL AFFILIATION (G002 + G003) which triggers R008 ExceptionFlag — agent cannot auto-resolve which group's agreement applies. Expected result: Low confidence, manual review required.",
        "Scenario C — Network Terminate: Dr. Emily Chen (P006, NPI 7788990011). Currently has Medicare + Commercial PPO. UiPath agent will TERMINATE her Commercial PPO participation. No eligibility rules run on termination — only confirms an active record exists.",
        "Scenario D — Group Mixed Request: Valley Medical Associates (G006), 5 providers (P007–P011). A batch email with an Excel roster triggers Add/Update/Terminate actions per row. All 5 work items share a batch_id. P007 and P008 already have Commercial PPO; P009 and P011 have none; P010 has Commercial PPO.",
        "",
        "== PROVIDERS ==",
    ]
    for p in providers:
        groups_str = "; ".join(aff_by_provider.get(p.provider_id, ["none"]))
        networks_str = "; ".join(part_by_provider.get(p.provider_id, ["none"]))
        dual = " [DUAL AFFILIATION]" if len(aff_by_provider.get(p.provider_id, [])) > 1 else ""
        lines.append(
            f"{p.provider_id} | {p.provider_name} | NPI:{p.npi} | {p.specialty} | "
            f"{p.county}, {p.state} | credentialing:{p.credentialing_status} | "
            f"board_cert:{p.board_certified} | groups:{groups_str}{dual} | networks:{networks_str}"
        )

    lines += ["", "== NETWORK CROSSWALK (group → network → agreement) =="]
    for cw, group, network in crosswalk:
        lines.append(
            f"{group.group_name} ({cw.group_id}) → {cw.network_code} → {cw.agreement_id} [{cw.product_line}]"
        )

    lines += ["", "== ELIGIBILITY RULES =="]
    for r in rules:
        lines.append(
            f"{r.rule_id} | {r.network_name} | {r.rule_type} | "
            f"{r.rule_value} | action_if_fails:{r.action_if_fails}"
        )

    lines += ["", "== ALL PARTICIPATIONS (current demo state — includes participation_id for tool calls) =="]
    for p in participations:
        lines.append(
            f"participation_id:{p.participation_id} | {p.provider_id} | {p.network_code} | "
            f"[{p.status}] | agr:{p.agreement_id or '—'} | eff:{p.effective_date} | source:{p.source}"
            + (f" | term:{p.termination_date}" if p.termination_date else "")
        )
    if not participations:
        lines.append("(no participations currently)")

    provider_id = context.get("provider_id")
    if provider_id:
        provider = db.query(models.Provider).filter(
            models.Provider.provider_id == provider_id).first()
        if provider:
            pparts = [p for p in participations if p.provider_id == provider_id]
            pgroups = aff_by_provider.get(provider_id, [])
            lines += [
                "",
                f"== CURRENTLY VIEWING: {provider.provider_name} ({provider_id}) ==",
                f"NPI: {provider.npi} | Specialty: {provider.specialty}",
                f"Location: {provider.county}, {provider.state}",
                f"Credentialing: {provider.credentialing_status} | Board Certified: {provider.board_certified}",
                f"License: {provider.license_number} expires {provider.license_expiration}",
                f"Groups: {', '.join(pgroups) if pgroups else 'none'}",
                f"Participations ({len(pparts)}):",
            ]
            for p in pparts:
                lines.append(
                    f"  - participation_id:{p.participation_id} | {p.network_code} [{p.status}] "
                    f"agr:{p.agreement_id or '—'} eff:{p.effective_date} source:{p.source}"
                    + (f" term:{p.termination_date}" if p.termination_date else "")
                )

    page = context.get("page", "")
    if page:
        lines += ["", f"== CURRENT PAGE: {page} =="]

    return "\n".join(lines)


class ChatRequest(BaseModel):
    messages: list[dict[str, Any]]
    context: dict[str, Any] = {}


class ChatReply(BaseModel):
    reply: str
    actions_taken: bool = False


@router.post("", response_model=ChatReply)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    client = _get_openai()
    system_prompt = _build_system_prompt(db, payload.context)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in payload.messages:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"]})

    actions_taken = False

    # Tool-use loop (max 3 iterations to prevent runaway)
    for _ in range(3):
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=512,
            temperature=0.2,
        )
        msg = response.choices[0].message

        if not msg.tool_calls:
            # No tool call — return the text response
            reply = msg.content or "Sorry, I couldn't generate a response."
            return ChatReply(reply=reply, actions_taken=actions_taken)

        # Execute tool calls
        messages.append(msg.model_dump(exclude_unset=True))
        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            result = _execute_tool(tc.function.name, args, db)
            actions_taken = True
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })

    # Fallback if loop exhausted
    return ChatReply(reply="Action completed.", actions_taken=actions_taken)
