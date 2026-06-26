from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
import seed
from database import get_db

router = APIRouter(prefix="/demo", tags=["demo"])

SCENARIO_PROVIDERS = {
    "A": ["P001"],
    "B": ["P002"],
    "C": ["P006"],
    "D": ["P007", "P008", "P009", "P010", "P011"],
}

SCENARIO_META = {
    "A": ("Network Add", "Dr. John Smith — clean approval"),
    "B": ("Network Update", "Dr. Maria Lopez — dual affiliation exception"),
    "C": ("Network Terminate", "Dr. Emily Chen — Commercial PPO"),
    "D": ("Group Mixed Request", "Valley Medical Associates — 5 providers"),
}


def _reset_providers(db: Session, provider_ids: list[str]):
    db.query(models.ProviderParticipation).filter(
        models.ProviderParticipation.provider_id.in_(provider_ids)
    ).delete(synchronize_session=False)
    db.query(models.AuditLog).filter(
        models.AuditLog.provider_id.in_(provider_ids)
    ).delete(synchronize_session=False)
    db.commit()

    rows = [row for row in seed.PRE_DEMO_PARTICIPATIONS if row[0] in provider_ids]
    for provider_id, network_code, agreement_id, effective_date in rows:
        import uuid as _uuid
        db.add(models.ProviderParticipation(
            participation_id=str(_uuid.uuid4()),
            provider_id=provider_id, network_code=network_code,
            agreement_id=agreement_id, effective_date=effective_date,
            status="Active", source="Manual",
        ))
    db.commit()


@router.post("/reset")
def reset_demo(db: Session = Depends(get_db)):
    db.query(models.ProviderParticipation).delete()
    db.query(models.AuditLog).delete()
    db.commit()
    seed.seed_pre_demo_participations(db)
    return {"success": True, "message": "Demo reset to initial pre-demo state."}


@router.post("/reset/{provider_id}")
def reset_provider(provider_id: str, db: Session = Depends(get_db)):
    if not db.query(models.Provider).filter(models.Provider.provider_id == provider_id).first():
        raise HTTPException(status_code=404, detail="Provider not found")
    _reset_providers(db, [provider_id])
    return {"success": True, "message": f"Provider {provider_id} reset to pre-demo state."}


@router.get("/status", response_model=list[schemas.DemoStatusOut])
def demo_status(db: Session = Depends(get_db)):
    results = []
    for scenario, provider_ids in SCENARIO_PROVIDERS.items():
        label, description = SCENARIO_META[scenario]
        has_action = (
            db.query(models.AuditLog)
            .filter(models.AuditLog.scenario == scenario)
            .first()
            is not None
        )
        results.append(schemas.DemoStatusOut(
            scenario=scenario, label=label, description=description,
            status="Complete" if has_action else "Ready",
        ))
    return results


@router.post("/scenario/{scenario}/setup")
def setup_scenario(scenario: str, db: Session = Depends(get_db)):
    scenario = scenario.upper()
    if scenario not in SCENARIO_PROVIDERS:
        raise HTTPException(status_code=404, detail="Unknown scenario. Use A, B, C, or D.")
    _reset_providers(db, SCENARIO_PROVIDERS[scenario])
    return {"success": True, "message": f"Scenario {scenario} pre-demo state configured."}
