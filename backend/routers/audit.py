from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=list[schemas.AuditLogOut])
def list_audit(
    provider_id: Optional[str] = None,
    scenario: Optional[str] = None,
    source: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.AuditLog)
    if provider_id:
        query = query.filter(models.AuditLog.provider_id == provider_id)
    if scenario:
        query = query.filter(models.AuditLog.scenario == scenario)
    if source:
        query = query.filter(models.AuditLog.source == source)
    return query.order_by(models.AuditLog.timestamp.desc()).all()


@router.get("/{transaction_id}", response_model=schemas.AuditLogOut)
def get_audit_entry(transaction_id: str, db: Session = Depends(get_db)):
    entry = db.query(models.AuditLog).filter(models.AuditLog.transaction_id == transaction_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Audit entry not found")
    return entry
