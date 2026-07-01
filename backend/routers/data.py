from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/data", tags=["data"])


@router.get("/groups", response_model=list[schemas.GroupOut])
def list_groups(db: Session = Depends(get_db)):
    return db.query(models.Group).order_by(models.Group.group_id).all()


@router.get("/networks", response_model=list[schemas.NetworkOut])
def list_networks(db: Session = Depends(get_db)):
    return db.query(models.Network).order_by(models.Network.network_code).all()


@router.get("/affiliations", response_model=list[schemas.AffiliationOut])
def list_affiliations(
    group_id: Optional[str] = None,
    provider_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.ProviderGroupAffiliation, models.Provider, models.Group)
        .join(models.Provider, models.Provider.provider_id == models.ProviderGroupAffiliation.provider_id)
        .join(models.Group, models.Group.group_id == models.ProviderGroupAffiliation.group_id)
    )
    if group_id:
        query = query.filter(models.ProviderGroupAffiliation.group_id == group_id)
    if provider_id:
        query = query.filter(models.ProviderGroupAffiliation.provider_id == provider_id)

    rows = query.order_by(models.ProviderGroupAffiliation.provider_id).all()
    return [
        schemas.AffiliationOut(
            provider_id=aff.provider_id,
            provider_name=provider.provider_name,
            npi=provider.npi,
            group_id=aff.group_id,
            group_name=group.group_name,
            effective_date=aff.effective_date,
            status=aff.status,
        )
        for aff, provider, group in rows
    ]


@router.get("/participations", response_model=list[schemas.ParticipationAllOut])
def list_all_participations(
    provider_id: Optional[str] = None,
    network_code: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.ProviderParticipation, models.Provider)
        .join(models.Provider, models.Provider.provider_id == models.ProviderParticipation.provider_id)
    )
    if provider_id:
        query = query.filter(models.ProviderParticipation.provider_id == provider_id)
    if network_code:
        query = query.filter(models.ProviderParticipation.network_code == network_code)
    if status:
        query = query.filter(models.ProviderParticipation.status == status)

    rows = query.order_by(
        models.ProviderParticipation.provider_id,
        models.ProviderParticipation.network_code,
    ).all()
    return [
        schemas.ParticipationAllOut(
            participation_id=p.participation_id,
            provider_id=p.provider_id,
            provider_name=provider.provider_name,
            npi=provider.npi,
            network_code=p.network_code,
            agreement_id=p.agreement_id,
            effective_date=p.effective_date,
            termination_date=p.termination_date,
            status=p.status,
            source=p.source,
            batch_id=p.batch_id,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p, provider in rows
    ]


@router.get("/rules", response_model=list[schemas.EligibilityRuleOut])
def list_rules(
    network_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.NetworkEligibilityRule)
    if network_name:
        query = query.filter(models.NetworkEligibilityRule.network_name == network_name)
    return query.order_by(models.NetworkEligibilityRule.rule_id).all()


@router.get("/agreements", response_model=list[schemas.AgreementOut])
def list_agreements(
    status: Optional[str] = None,
    group_id: Optional[str] = None,
    network_code: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Agreement, models.Group, models.Network)
        .join(models.Group, models.Group.group_id == models.Agreement.group_id)
        .join(models.Network, models.Network.network_code == models.Agreement.network_code)
    )
    if status:
        query = query.filter(models.Agreement.status == status)
    if group_id:
        query = query.filter(models.Agreement.group_id == group_id)
    if network_code:
        query = query.filter(models.Agreement.network_code == network_code)

    rows = query.order_by(models.Agreement.group_id, models.Agreement.network_code).all()
    return [
        schemas.AgreementOut(
            agreement_id=agr.agreement_id,
            agreement_name=agr.agreement_name,
            group_id=agr.group_id,
            group_name=group.group_name,
            network_code=agr.network_code,
            network_name=network.network_name,
            effective_date=agr.effective_date,
            expiration_date=agr.expiration_date,
            status=agr.status,
        )
        for agr, group, network in rows
    ]
