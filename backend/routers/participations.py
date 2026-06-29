import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from audit import write_audit
from database import get_db

router = APIRouter(tags=["participations"])


def _get_provider_or_404(db: Session, provider_id: str) -> models.Provider:
    provider = db.query(models.Provider).filter(models.Provider.provider_id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


def _get_participation_or_404(db: Session, participation_id: str) -> models.ProviderParticipation:
    participation = (
        db.query(models.ProviderParticipation)
        .filter(models.ProviderParticipation.participation_id == participation_id)
        .first()
    )
    if not participation:
        raise HTTPException(status_code=404, detail="Participation not found")
    return participation


def _validate_agreement(db: Session, provider: models.Provider, network_code: str, agreement_id: str | None):
    """An agreement_id, if given, must belong to the requested network AND to
    one of the provider's active groups — same crosswalk join the Crosswalk
    tab displays, just enforced here instead of left to free text."""
    if not agreement_id:
        return

    crosswalk_row = (
        db.query(models.Crosswalk)
        .filter(models.Crosswalk.agreement_id == agreement_id, models.Crosswalk.network_code == network_code)
        .first()
    )
    if not crosswalk_row:
        raise HTTPException(
            status_code=422,
            detail=f"Agreement '{agreement_id}' is not a valid agreement for network '{network_code}'.",
        )

    active_group_ids = {
        aff.group_id
        for aff in db.query(models.ProviderGroupAffiliation)
        .filter(models.ProviderGroupAffiliation.provider_id == provider.provider_id,
                 models.ProviderGroupAffiliation.status == "Active")
        .all()
    }
    if crosswalk_row.group_id not in active_group_ids:
        valid = (
            db.query(models.Crosswalk.agreement_id)
            .filter(models.Crosswalk.network_code == network_code, models.Crosswalk.group_id.in_(active_group_ids))
            .all()
        )
        valid_ids = [v[0] for v in valid]
        hint = f"Valid options for {provider.provider_name}: {', '.join(valid_ids)}" if valid_ids else \
            f"{provider.provider_name}'s group(s) have no agreement on file for network '{network_code}'."
        raise HTTPException(
            status_code=422,
            detail=f"Agreement '{agreement_id}' does not belong to {provider.provider_name}'s group(s). {hint}",
        )


@router.get("/providers/{provider_id}/participations", response_model=list[schemas.ParticipationOut])
def list_participations(provider_id: str, db: Session = Depends(get_db)):
    _get_provider_or_404(db, provider_id)
    return (
        db.query(models.ProviderParticipation)
        .filter(models.ProviderParticipation.provider_id == provider_id)
        .order_by(models.ProviderParticipation.created_at.desc())
        .all()
    )


@router.post("/providers/{provider_id}/participations", response_model=schemas.ParticipationOut, status_code=201)
def add_participation(provider_id: str, payload: schemas.ParticipationCreate, db: Session = Depends(get_db)):
    provider = _get_provider_or_404(db, provider_id)

    if not db.query(models.Network).filter(models.Network.network_code == payload.network_code).first():
        raise HTTPException(status_code=422, detail=f"Unknown network_code: {payload.network_code}")

    _validate_agreement(db, provider, payload.network_code, payload.agreement_id)

    participation = models.ProviderParticipation(
        participation_id=str(uuid.uuid4()),
        provider_id=provider_id,
        network_code=payload.network_code,
        agreement_id=payload.agreement_id,
        effective_date=payload.effective_date,
        status="Active",
        source=payload.source,
        batch_id=payload.batch_id,
    )
    db.add(participation)
    db.commit()
    db.refresh(participation)

    write_audit(
        db, provider=provider, action_type="Add", network_code=payload.network_code,
        new_status="Active", source=payload.source, agreement_id=payload.agreement_id,
        effective_date=payload.effective_date, work_item_id=payload.work_item_id,
        analyst_name=payload.analyst_name, batch_id=payload.batch_id,
        scenario=payload.scenario, notes=payload.notes,
    )
    return participation


@router.put("/participations/{participation_id}", response_model=schemas.ParticipationOut)
def update_participation(participation_id: str, payload: schemas.ParticipationUpdate, db: Session = Depends(get_db)):
    participation = _get_participation_or_404(db, participation_id)
    provider = _get_provider_or_404(db, participation.provider_id)
    previous_status = participation.status

    if payload.agreement_id:
        _validate_agreement(db, provider, participation.network_code, payload.agreement_id)

    for field, value in payload.model_dump(exclude_unset=True, exclude={"analyst_name", "notes", "source"}).items():
        setattr(participation, field, value)
    source = payload.source or "Manual"
    participation.source = source

    db.commit()
    db.refresh(participation)

    write_audit(
        db, provider=provider, action_type="Update", network_code=participation.network_code,
        new_status=participation.status, source=source, agreement_id=participation.agreement_id,
        effective_date=participation.effective_date, previous_status=previous_status,
        analyst_name=payload.analyst_name, notes=payload.notes,
    )
    return participation


@router.delete("/participations/{participation_id}", response_model=schemas.ParticipationOut)
def terminate_participation(participation_id: str, payload: schemas.ParticipationTerminate, db: Session = Depends(get_db)):
    participation = _get_participation_or_404(db, participation_id)
    provider = _get_provider_or_404(db, participation.provider_id)
    previous_status = participation.status

    if participation.effective_date and payload.termination_date < participation.effective_date:
        raise HTTPException(
            status_code=422,
            detail=f"Termination date ({payload.termination_date}) cannot be before the "
                    f"effective date ({participation.effective_date}).",
        )

    participation.status = "Terminated"
    participation.termination_date = payload.termination_date
    participation.source = payload.source

    db.commit()
    db.refresh(participation)

    write_audit(
        db, provider=provider, action_type="Terminate", network_code=participation.network_code,
        new_status="Terminated", source=payload.source, agreement_id=participation.agreement_id,
        effective_date=participation.effective_date, termination_date=payload.termination_date,
        previous_status=previous_status, analyst_name=payload.analyst_name, notes=payload.notes,
    )
    return participation


@router.get("/participations/batch/{batch_id}", response_model=list[schemas.ParticipationOut])
def get_batch(batch_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.ProviderParticipation)
        .filter(models.ProviderParticipation.batch_id == batch_id)
        .order_by(models.ProviderParticipation.provider_id)
        .all()
    )
