import os
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
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


class ChatRequest(BaseModel):
    messages: list[dict[str, Any]]
    context: dict[str, Any] = {}


class ChatReply(BaseModel):
    reply: str


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
        "Do not suggest making changes — you are read-only.",
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

    lines += ["", "== ACTIVE PARTICIPATIONS (current demo state) =="]
    active = [p for p in participations if p.status == "Active"]
    if active:
        for p in active:
            lines.append(
                f"{p.provider_id} | {p.network_code} | {p.agreement_id or '—'} | "
                f"eff:{p.effective_date} | source:{p.source}"
                + (f" | batch:{p.batch_id}" if p.batch_id else "")
            )
    else:
        lines.append("(no active participations currently)")

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
                    f"  - {p.network_code} [{p.status}] agr:{p.agreement_id or '—'} "
                    f"eff:{p.effective_date}"
                    + (f" term:{p.termination_date}" if p.termination_date else "")
                    + f" source:{p.source}"
                )

    page = context.get("page", "")
    if page:
        lines += ["", f"== CURRENT PAGE: {page} =="]

    return "\n".join(lines)


@router.post("", response_model=ChatReply)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    client = _get_openai()
    system_prompt = _build_system_prompt(db, payload.context)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in payload.messages:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"]})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=512,
        temperature=0.2,
    )
    reply = response.choices[0].message.content or "Sorry, I couldn't generate a response."
    return ChatReply(reply=reply)
