from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel


class ParticipationOut(BaseModel):
    participation_id: str
    network_code: str
    agreement_id: Optional[str]
    effective_date: Optional[date]
    termination_date: Optional[date]
    status: str
    source: str
    batch_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProviderOut(BaseModel):
    provider_id: str
    provider_name: str
    npi: str
    specialty: Optional[str]
    county: Optional[str]
    state: Optional[str]
    office_address: Optional[str]
    office_phone: Optional[str]
    email: Optional[str]
    credentialing_status: str
    board_certified: bool
    license_number: Optional[str]
    license_expiration: Optional[date]
    is_active: bool
    updated_at: datetime
    participation_count: int = 0
    networks: List[str] = []
    group_names: List[str] = []

    class Config:
        from_attributes = True


class ProviderDetailOut(ProviderOut):
    participations: List[ParticipationOut] = []
    group_affiliations: List[dict] = []


class ProviderUpdate(BaseModel):
    provider_name: Optional[str] = None
    specialty: Optional[str] = None
    county: Optional[str] = None
    state: Optional[str] = None
    office_address: Optional[str] = None
    office_phone: Optional[str] = None
    email: Optional[str] = None
    credentialing_status: Optional[str] = None
    board_certified: Optional[bool] = None
    license_number: Optional[str] = None
    license_expiration: Optional[date] = None


class ParticipationCreate(BaseModel):
    network_code: str
    agreement_id: Optional[str] = None
    effective_date: date
    source: str = "Manual"
    work_item_id: Optional[str] = None
    analyst_name: Optional[str] = None
    batch_id: Optional[str] = None
    scenario: Optional[str] = None
    notes: Optional[str] = None


class ParticipationUpdate(BaseModel):
    agreement_id: Optional[str] = None
    effective_date: Optional[date] = None
    status: Optional[str] = None
    source: Optional[str] = None
    analyst_name: Optional[str] = None
    notes: Optional[str] = None


class ParticipationTerminate(BaseModel):
    termination_date: date
    source: str = "Manual"
    analyst_name: Optional[str] = None
    notes: Optional[str] = None


class AuditLogOut(BaseModel):
    transaction_id: str
    work_item_id: Optional[str]
    provider_id: str
    provider_name: str
    action_type: str
    network_code: str
    agreement_id: Optional[str]
    effective_date: Optional[date]
    termination_date: Optional[date]
    previous_status: Optional[str]
    new_status: str
    performed_by: str
    analyst_name: Optional[str]
    source: str
    batch_id: Optional[str]
    scenario: Optional[str]
    notes: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class CrosswalkOut(BaseModel):
    group_id: str
    group_name: str
    network_code: str
    network_name: str
    agreement_id: str
    product_line: Optional[str]


class DemoStatusOut(BaseModel):
    scenario: str
    label: str
    status: str
    description: str
