import uuid
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

import models

SOURCE_PERFORMER = {
    "API": "UiPath Agent",
    "RPA": "UiPath RPA",
    "Manual": "Manual",
}


def write_audit(
    db: Session,
    *,
    provider: models.Provider,
    action_type: str,
    network_code: str,
    new_status: str,
    source: str,
    agreement_id: Optional[str] = None,
    effective_date: Optional[date] = None,
    termination_date: Optional[date] = None,
    previous_status: Optional[str] = None,
    work_item_id: Optional[str] = None,
    analyst_name: Optional[str] = None,
    batch_id: Optional[str] = None,
    scenario: Optional[str] = None,
    notes: Optional[str] = None,
) -> models.AuditLog:
    """Single write path for every audit_log row. Every participation
    create/update/delete must call this — never write a participation
    without a matching audit entry."""
    performed_by = analyst_name if (source == "Manual" and analyst_name) else SOURCE_PERFORMER.get(source, source)

    entry = models.AuditLog(
        transaction_id=str(uuid.uuid4()),
        work_item_id=work_item_id,
        provider_id=provider.provider_id,
        provider_name=provider.provider_name,
        action_type=action_type,
        network_code=network_code,
        agreement_id=agreement_id,
        effective_date=effective_date,
        termination_date=termination_date,
        previous_status=previous_status,
        new_status=new_status,
        performed_by=performed_by,
        analyst_name=analyst_name,
        source=source,
        batch_id=batch_id,
        scenario=scenario,
        notes=notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
