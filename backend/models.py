from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime, ForeignKey
)
from sqlalchemy.sql import func

from database import Base


class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True)
    provider_id = Column(String, unique=True, nullable=False)
    provider_name = Column(String, nullable=False)
    npi = Column(String, unique=True, nullable=False)
    specialty = Column(String)
    county = Column(String)
    state = Column(String)
    office_address = Column(String)
    office_phone = Column(String)
    email = Column(String)
    credentialing_status = Column(String, default="Active")
    board_certified = Column(Boolean, default=False)
    license_number = Column(String)
    license_expiration = Column(Date)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    group_id = Column(String, unique=True, nullable=False)
    group_name = Column(String, nullable=False)
    tax_id = Column(String)
    status = Column(String, default="Active")


class ProviderGroupAffiliation(Base):
    __tablename__ = "provider_group_affiliations"

    id = Column(Integer, primary_key=True)
    provider_id = Column(String, ForeignKey("providers.provider_id"), nullable=False)
    group_id = Column(String, ForeignKey("groups.group_id"), nullable=False)
    effective_date = Column(Date)
    status = Column(String, default="Active")
    created_at = Column(DateTime, server_default=func.now())


class Network(Base):
    __tablename__ = "networks"

    id = Column(Integer, primary_key=True)
    network_code = Column(String, unique=True, nullable=False)
    network_name = Column(String, nullable=False)
    product_line = Column(String)
    description = Column(String)


class Crosswalk(Base):
    __tablename__ = "crosswalk"

    id = Column(Integer, primary_key=True)
    group_id = Column(String, ForeignKey("groups.group_id"), nullable=False)
    network_code = Column(String, ForeignKey("networks.network_code"), nullable=False)
    agreement_id = Column(String, unique=True, nullable=False)
    product_line = Column(String)


class ProviderParticipation(Base):
    __tablename__ = "provider_participations"

    id = Column(Integer, primary_key=True)
    participation_id = Column(String, unique=True, nullable=False)
    provider_id = Column(String, ForeignKey("providers.provider_id"), nullable=False)
    network_code = Column(String, ForeignKey("networks.network_code"), nullable=False)
    agreement_id = Column(String)
    effective_date = Column(Date)
    termination_date = Column(Date, nullable=True)
    status = Column(String, default="Active")
    source = Column(String, default="Manual")
    batch_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class NetworkEligibilityRule(Base):
    __tablename__ = "network_eligibility_rules"

    id = Column(Integer, primary_key=True)
    rule_id = Column(String, unique=True, nullable=False)
    network_name = Column(String, nullable=False)
    rule_type = Column(String, nullable=False)
    rule_value = Column(String)
    action_if_fails = Column(String)
    notes = Column(String)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True)
    transaction_id = Column(String, unique=True, nullable=False)
    work_item_id = Column(String, nullable=True)
    provider_id = Column(String)
    provider_name = Column(String)
    action_type = Column(String)
    network_code = Column(String)
    agreement_id = Column(String, nullable=True)
    effective_date = Column(Date, nullable=True)
    termination_date = Column(Date, nullable=True)
    previous_status = Column(String, nullable=True)
    new_status = Column(String)
    performed_by = Column(String)
    analyst_name = Column(String, nullable=True)
    source = Column(String)
    batch_id = Column(String, nullable=True)
    scenario = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())
