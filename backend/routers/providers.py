from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/providers", tags=["providers"])


def _to_provider_out(db: Session, provider: models.Provider) -> dict:
    participations = (
        db.query(models.ProviderParticipation)
        .filter(models.ProviderParticipation.provider_id == provider.provider_id)
        .all()
    )
    active_networks = [p.network_code for p in participations if p.status == "Active"]

    group_names = (
        db.query(models.Group.group_name)
        .join(models.ProviderGroupAffiliation, models.ProviderGroupAffiliation.group_id == models.Group.group_id)
        .filter(models.ProviderGroupAffiliation.provider_id == provider.provider_id)
        .filter(models.ProviderGroupAffiliation.status == "Active")
        .all()
    )

    data = schemas.ProviderOut.model_validate(provider).model_dump()
    data["participation_count"] = len(participations)
    data["networks"] = active_networks
    data["group_names"] = [g[0] for g in group_names]
    return data


@router.get("", response_model=list[schemas.ProviderOut])
def list_providers(db: Session = Depends(get_db)):
    providers = db.query(models.Provider).order_by(models.Provider.provider_id).all()
    return [_to_provider_out(db, p) for p in providers]


@router.get("/search", response_model=list[schemas.ProviderOut])
def search_providers(q: str, db: Session = Depends(get_db)):
    term = f"%{q}%"
    providers = (
        db.query(models.Provider)
        .filter(or_(
            models.Provider.provider_name.ilike(term),
            models.Provider.npi.ilike(term),
            models.Provider.specialty.ilike(term),
        ))
        .order_by(models.Provider.provider_id)
        .all()
    )
    return [_to_provider_out(db, p) for p in providers]


@router.get("/{provider_id}", response_model=schemas.ProviderDetailOut)
def get_provider(provider_id: str, db: Session = Depends(get_db)):
    provider = db.query(models.Provider).filter(models.Provider.provider_id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    base = _to_provider_out(db, provider)

    participations = (
        db.query(models.ProviderParticipation)
        .filter(models.ProviderParticipation.provider_id == provider_id)
        .order_by(models.ProviderParticipation.created_at.desc())
        .all()
    )

    affiliations = (
        db.query(models.ProviderGroupAffiliation, models.Group)
        .join(models.Group, models.Group.group_id == models.ProviderGroupAffiliation.group_id)
        .filter(models.ProviderGroupAffiliation.provider_id == provider_id)
        .all()
    )
    group_affiliations = [
        {
            "group_id": aff.group_id,
            "group_name": group.group_name,
            "status": aff.status,
            "effective_date": aff.effective_date,
        }
        for aff, group in affiliations
    ]

    base["participations"] = participations
    base["group_affiliations"] = group_affiliations
    return base


@router.put("/{provider_id}", response_model=schemas.ProviderDetailOut)
def update_provider(provider_id: str, payload: schemas.ProviderUpdate, db: Session = Depends(get_db)):
    provider = db.query(models.Provider).filter(models.Provider.provider_id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(provider, field, value)

    db.commit()
    return get_provider(provider_id, db)
