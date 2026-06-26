import uuid
from datetime import date

from sqlalchemy.orm import Session

import models

GROUPS = [
    ("G001", "ABC Medical Group", "12-3456789"),
    ("G002", "Riverside Community Health", "98-7654321"),
    ("G003", "Inland Valley Medical Group", "55-4433221"),
    ("G004", "Desert Health Partners", "66-7788990"),
    ("G005", "Pacific Coast Medical Group", "77-8899001"),
    ("G006", "Valley Medical Associates", "62-1234567"),
]

NETWORKS = [
    ("Medicare", "Medicare Advantage", "MA", "Medicare Advantage network"),
    ("CCN", "Community Care Network", "Commercial HMO", "Commercial HMO network"),
    ("COD", "Community of Doctors", "Commercial HMO", "PCP-only HMO network"),
    ("Commercial PPO", "Commercial PPO", "Commercial PPO", "Statewide commercial PPO"),
]

# provider_id, name, npi, specialty, county, credentialing_status, board_certified
PROVIDERS = [
    ("P001", "Dr. John Smith", "1234567890", "Cardiovascular Disease", "Los Angeles", "Active", True),
    ("P002", "Dr. Maria Lopez", "9876543210", "Internal Medicine", "Riverside", "Active", True),
    ("P003", "Dr. Alan Carter", "1122334455", "Pediatrics", "Orange", "Active", True),
    ("P004", "Dr. Sarah Nguyen", "5544332211", "Family Medicine", "San Bernardino", "Pending", False),
    ("P005", "Dr. Robert Kim", "6677889900", "Orthopedics", "Los Angeles", "Active", True),
    ("P006", "Dr. Emily Chen", "7788990011", "Neurology", "San Diego", "Active", True),
    ("P007", "Dr. Robert Torres", "2345678901", "Cardiovascular Disease", "Los Angeles", "Active", True),
    ("P008", "Dr. Sarah Kim", "3456789012", "Family Medicine", "Los Angeles", "Active", True),
    ("P009", "Dr. James Patel", "4567890123", "Neurology", "Los Angeles", "Active", True),
    ("P010", "Dr. Lisa Nguyen", "5678901234", "Internal Medicine", "Los Angeles", "Active", True),
    ("P011", "Dr. Michael Chang", "6789012345", "Pediatrics", "Los Angeles", "Active", True),
]

# provider_id -> [group_id, ...] (P002 has two -> dual affiliation, Scenario B exception)
AFFILIATIONS = {
    "P001": ["G001"],
    "P002": ["G002", "G003"],
    "P003": ["G001"],
    "P004": ["G004"],
    "P005": ["G003"],
    "P006": ["G005"],
    "P007": ["G006"],
    "P008": ["G006"],
    "P009": ["G006"],
    "P010": ["G006"],
    "P011": ["G006"],
}

# Demographic extras keyed by provider_id, applied on top of PROVIDERS
DEMOGRAPHICS = {
    "P001": dict(office_address="123 Medical Plaza, Suite 200", office_phone="(310) 555-0100",
                 email="jsmith@abcmedical.com", license_number="G-112233", license_expiration=date(2028, 6, 30)),
    "P002": dict(office_address="450 Riverside Ave, Suite 100", office_phone="(951) 555-0142",
                 email="mlopez@riversidehealth.com", license_number="G-225544", license_expiration=date(2027, 3, 15)),
    "P003": dict(office_address="78 Orange Grove Blvd", office_phone="(714) 555-0133",
                 email="acarter@abcmedical.com", license_number="G-339911", license_expiration=date(2029, 1, 10)),
    "P004": dict(office_address="900 Desert Vista Rd", office_phone="(909) 555-0188",
                 email="snguyen@deserthealth.com", license_number="G-447722", license_expiration=date(2026, 11, 1)),
    "P005": dict(office_address="201 Inland Valley Pkwy", office_phone="(909) 555-0177",
                 email="rkim@inlandvalleymg.com", license_number="G-556633", license_expiration=date(2027, 9, 22)),
    "P006": dict(office_address="55 Pacific Coast Hwy", office_phone="(619) 555-0199",
                 email="echen@pacificcoastmg.com", license_number="G-668844", license_expiration=date(2028, 2, 5)),
    "P007": dict(office_address="300 Valley Medical Dr, Bldg A", office_phone="(909) 555-0211",
                 email="rtorres@valleymedical.com", license_number="G-771122", license_expiration=date(2027, 7, 18)),
    "P008": dict(office_address="300 Valley Medical Dr, Bldg B", office_phone="(909) 555-0212",
                 email="skim@valleymedical.com", license_number="G-882233", license_expiration=date(2028, 4, 9)),
    "P009": dict(office_address="300 Valley Medical Dr, Bldg C", office_phone="(909) 555-0213",
                 email="jpatel@valleymedical.com", license_number="G-993344", license_expiration=date(2026, 12, 30)),
    "P010": dict(office_address="300 Valley Medical Dr, Bldg D", office_phone="(909) 555-0214",
                 email="lnguyen@valleymedical.com", license_number="G-104455", license_expiration=date(2027, 5, 14)),
    "P011": dict(office_address="300 Valley Medical Dr, Bldg E", office_phone="(909) 555-0215",
                 email="mchang@valleymedical.com", license_number="G-115566", license_expiration=date(2029, 8, 2)),
}

# Pre-demo participations: provider_id, network_code, agreement_id, effective_date, group_id (for agreement naming)
PRE_DEMO_PARTICIPATIONS = [
    # P001 (Dr. John Smith) -> none yet; Scenario A will add Medicare/CCN/Commercial PPO
    # P002 (Dr. Maria Lopez) -> Commercial PPO only; Scenario B updates it (exception: dual affiliation)
    ("P002", "Commercial PPO", "AGR-G002-PPO", date(2025, 1, 1)),
    # P003 (Dr. Alan Carter) -> fully assigned
    ("P003", "Medicare", "AGR-G001-MCR", date(2024, 6, 1)),
    ("P003", "CCN", "AGR-G001-CCN", date(2024, 6, 1)),
    ("P003", "Commercial PPO", "AGR-G001-PPO", date(2024, 6, 1)),
    # P004 (Dr. Sarah Nguyen) -> none, credentialing pending
    # P005 (Dr. Robert Kim)
    ("P005", "Commercial PPO", "AGR-G003-PPO", date(2024, 9, 1)),
    # P006 (Dr. Emily Chen) -> Medicare + Commercial PPO; Scenario C terminates Commercial PPO
    ("P006", "Medicare", "AGR-G005-MCR", date(2024, 3, 1)),
    ("P006", "Commercial PPO", "AGR-G005-PPO", date(2024, 3, 1)),
    # P007-P011 (Valley Medical) -> vary, for Scenario D group mixed request
    ("P007", "Commercial PPO", "AGR-G006-PPO", date(2025, 2, 1)),
    ("P008", "Commercial PPO", "AGR-G006-PPO", date(2025, 2, 1)),
    ("P010", "Commercial PPO", "AGR-G006-PPO", date(2025, 2, 1)),
    # P009, P011 -> none yet (Scenario D will add them)
]


def _seed_reference_data(db: Session):
    """Groups, networks, providers, affiliations — static reference data, seeded once."""
    if db.query(models.Group).count() == 0:
        for group_id, name, tax_id in GROUPS:
            db.add(models.Group(group_id=group_id, group_name=name, tax_id=tax_id, status="Active"))

    if db.query(models.Network).count() == 0:
        for code, name, product_line, description in NETWORKS:
            db.add(models.Network(network_code=code, network_name=name,
                                   product_line=product_line, description=description))

    if db.query(models.Provider).count() == 0:
        for provider_id, name, npi, specialty, county, status, board_cert in PROVIDERS:
            extras = DEMOGRAPHICS.get(provider_id, {})
            db.add(models.Provider(
                provider_id=provider_id, provider_name=name, npi=npi, specialty=specialty,
                county=county, state="CA", credentialing_status=status, board_certified=board_cert,
                is_active=True, **extras,
            ))

    db.flush()

    if db.query(models.ProviderGroupAffiliation).count() == 0:
        for provider_id, group_ids in AFFILIATIONS.items():
            for group_id in group_ids:
                db.add(models.ProviderGroupAffiliation(
                    provider_id=provider_id, group_id=group_id,
                    effective_date=date(2024, 1, 1), status="Active",
                ))

    db.commit()


def seed_pre_demo_participations(db: Session):
    """(Re)create the pre-demo participation state. Used on first boot AND by /demo/reset."""
    for provider_id, network_code, agreement_id, effective_date in PRE_DEMO_PARTICIPATIONS:
        db.add(models.ProviderParticipation(
            participation_id=str(uuid.uuid4()),
            provider_id=provider_id,
            network_code=network_code,
            agreement_id=agreement_id,
            effective_date=effective_date,
            status="Active",
            source="Manual",
        ))
    db.commit()


def run_seed(db: Session):
    """Idempotent startup seed: reference data once, participations only if table is empty."""
    _seed_reference_data(db)
    if db.query(models.ProviderParticipation).count() == 0:
        seed_pre_demo_participations(db)
