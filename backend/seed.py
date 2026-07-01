import uuid
from datetime import date

from sqlalchemy.orm import Session

import models

GROUPS = [
    # group_id, group_name, tax_id, primary_county
    ("G001", "ABC Medical Group",           "45-6789012", "Los Angeles"),
    ("G002", "Riverside Community Health",  "33-9876543", "Riverside"),
    ("G003", "Inland Valley Medical Group", "55-4433221", "San Bernardino"),
    ("G004", "Desert Health Partners",      "66-7788990", "San Bernardino"),
    ("G005", "Pacific Coast Medical Group", "77-8899001", "San Diego"),
    ("G006", "Valley Medical Associates",   "62-1234567", "Los Angeles"),
]

NETWORKS = [
    ("Medicare", "Medicare Advantage", "MA", "Medicare Advantage network"),
    ("CCN", "Community Care Network", "Commercial HMO", "Commercial HMO network"),
    ("COD", "Community of Doctors", "Commercial HMO", "PCP-only HMO network"),
    ("Commercial PPO", "Commercial PPO", "Commercial PPO", "Statewide commercial PPO"),
]

# Agreement Repository — all agreements (including Expired/Pending).
# Single source of truth for agreement metadata synced with UiPath Data Service.
# group_id, network_code, agreement_id, product_line — CROSSWALK references these.
# agreement_id, agreement_name, group_id, network_code, eff_date, exp_date, status
AGREEMENTS = [
    ("AGR-G001-CCN-LEGACY", "ABC MG - CCN (Legacy)",      "G001", "CCN",          date(2020, 1, 1), date(2023, 12, 31), "Expired"),
    ("AGR-G001-MCR",        "ABC MG - Medicare",           "G001", "Medicare",     date(2024, 1, 1), date(2026, 12, 31), "Active"),
    ("AGR-G001-CCN",        "ABC MG - CCN",                "G001", "CCN",          date(2024, 1, 1), date(2026, 12, 31), "Active"),
    ("AGR-G001-COD",        "ABC MG - COD",                "G001", "COD",          date(2024, 1, 1), date(2026, 12, 31), "Active"),
    ("AGR-G001-PPO",        "ABC MG - Commercial PPO",     "G001", "Commercial PPO", date(2024, 1, 1), date(2026, 12, 31), "Active"),
    ("AGR-G002-MCR",        "RCH - Medicare",              "G002", "Medicare",     date(2023, 7, 1), date(2026, 6, 30),  "Active"),
    ("AGR-G002-CCN",        "RCH - CCN",                   "G002", "CCN",          date(2023, 7, 1), date(2026, 6, 30),  "Active"),
    ("AGR-G002-PPO",        "RCH - Commercial PPO",        "G002", "Commercial PPO", date(2023, 7, 1), date(2026, 7, 31), "Active"),
    ("AGR-G003-PPO",        "IVM - Commercial PPO",        "G003", "Commercial PPO", date(2025, 1, 1), date(2027, 12, 31), "Active"),
    ("AGR-G003-CCN",        "IVM - CCN",                   "G003", "CCN",          date(2026, 9, 1), date(2028, 8, 31),  "Active"),
    ("AGR-G004-PPO",        "DHP - Commercial PPO",        "G004", "Commercial PPO", date(2025, 1, 1), date(2027, 12, 31), "Active"),
    ("AGR-G005-MCR-LEGACY", "PCM - Medicare (Legacy)",     "G005", "Medicare",     date(2022, 1, 1), date(2025, 12, 31), "Expired"),
    ("AGR-G005-MCR",        "PCM - Medicare",              "G005", "Medicare",     date(2026, 1, 1), date(2028, 12, 31), "Active"),
    ("AGR-G005-PPO",        "PCM - Commercial PPO",        "G005", "Commercial PPO", date(2026, 1, 1), date(2028, 12, 31), "Active"),
    ("AGR-G006-PPO",        "VMA - Commercial PPO",        "G006", "Commercial PPO", date(2026, 1, 1), date(2028, 12, 31), "Active"),
    ("AGR-G006-MCR",        "VMA - Medicare",              "G006", "Medicare",     date(2026, 1, 1), date(2028, 12, 31), "Active"),
    ("AGR-G006-CCN",        "VMA - CCN",                   "G006", "CCN",          date(2026, 1, 1), date(2028, 12, 31), "Active"),
]

# Active crosswalk: which (group, network) pairs are in effect for the demo.
# Only Active agreements appear here — Expired/Pending agreements are in AGREEMENTS
# but not in the crosswalk used for participation validation.
# group_id, network_code, agreement_id, product_line
CROSSWALK = [
    ("G001", "Medicare",       "AGR-G001-MCR", "MA"),
    ("G001", "CCN",            "AGR-G001-CCN", "Commercial HMO"),
    ("G001", "COD",            "AGR-G001-COD", "Commercial HMO"),
    ("G001", "Commercial PPO", "AGR-G001-PPO", "Commercial PPO"),
    ("G002", "Medicare",       "AGR-G002-MCR", "MA"),
    ("G002", "CCN",            "AGR-G002-CCN", "Commercial HMO"),
    ("G002", "Commercial PPO", "AGR-G002-PPO", "Commercial PPO"),
    ("G003", "CCN",            "AGR-G003-CCN", "Commercial HMO"),
    ("G003", "Commercial PPO", "AGR-G003-PPO", "Commercial PPO"),
    ("G004", "Commercial PPO", "AGR-G004-PPO", "Commercial PPO"),
    ("G005", "Medicare",       "AGR-G005-MCR", "MA"),
    ("G005", "Commercial PPO", "AGR-G005-PPO", "Commercial PPO"),
    ("G006", "CCN",            "AGR-G006-CCN", "Commercial HMO"),
    ("G006", "Commercial PPO", "AGR-G006-PPO", "Commercial PPO"),
    ("G006", "Medicare",       "AGR-G006-MCR", "MA"),
]


def agreement_for(group_id: str, network_code: str) -> str:
    """Look up the crosswalk agreement_id for a (group, network) pair.
    Raises if the combo isn't on file — pre-demo data must only reference
    combos that actually exist in CROSSWALK."""
    for g, n, agreement_id, _ in CROSSWALK:
        if g == group_id and n == network_code:
            return agreement_id
    raise ValueError(f"No crosswalk entry for group={group_id} network={network_code}")

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

# Pre-demo participations: provider_id, group_id (which crosswalk agreement
# applies), network_code, effective_date. agreement_id is resolved from
# CROSSWALK at seed time via agreement_for() — never hardcoded here.
# Network eligibility rules from UIPATH_BUILD_STEPS.md Appendix B.
# rule_id, network_name, rule_type, rule_value, action_if_fails, notes
ELIGIBILITY_RULES = [
    ("R001", "COD", "Specialty", "PCP Only: Family Medicine, Internal Medicine, Pediatrics", "Exclude", "COD is PCP-only"),
    ("R002", "Medicare", "Credentialing", "credentialing_status must be Active", "Exclude", "CMS requirement"),
    ("R003", "CCN", "BoardCertification", "board_certified must be True", "Exclude", "CCN quality standard"),
    ("R004", "CCN", "Geography", "county in: Los Angeles, Riverside, Orange", "Exclude", "CCN regional network"),
    ("R005", "Medicare", "Geography", "county in: Los Angeles, Riverside, Orange, San Bernardino", "Exclude", "Broader Medicare footprint"),
    ("R006", "Commercial PPO", "Geography", "All counties (statewide)", "N/A", "Statewide PPO"),
    ("R007", "All Networks", "Agreement", "Active and not expiring within 30 days of effective_date", "ExceptionFlag", "Triggers manual review"),
    ("R008", "All Networks", "DualAffiliation", "Provider must have only one active group affiliation", "ExceptionFlag", "Dual affiliation — agent cannot auto-resolve which group's agreement applies"),
    ("R009", "Medicare", "Specialty", "All specialties eligible", "N/A", "No specialty restriction"),
    ("R010", "Commercial PPO", "Specialty", "All specialties eligible", "N/A", "Open specialty PPO"),
]


PRE_DEMO_PARTICIPATIONS = [
    # P001 (Dr. John Smith) -> none yet; Scenario A will add Medicare/CCN/Commercial PPO
    # P002 (Dr. Maria Lopez) -> Commercial PPO only; Scenario B updates it (exception: dual affiliation)
    ("P002", "G002", "Commercial PPO", date(2025, 1, 1)),
    # P003 (Dr. Alan Carter) -> fully assigned
    ("P003", "G001", "Medicare", date(2024, 6, 1)),
    ("P003", "G001", "CCN", date(2024, 6, 1)),
    ("P003", "G001", "Commercial PPO", date(2024, 6, 1)),
    # P004 (Dr. Sarah Nguyen) -> none, credentialing pending
    # P005 (Dr. Robert Kim)
    ("P005", "G003", "Commercial PPO", date(2024, 9, 1)),
    # P006 (Dr. Emily Chen) -> Medicare + Commercial PPO; Scenario C terminates Commercial PPO
    ("P006", "G005", "Medicare", date(2024, 3, 1)),
    ("P006", "G005", "Commercial PPO", date(2024, 3, 1)),
    # P007-P011 (Valley Medical) -> vary, for Scenario D group mixed request
    ("P007", "G006", "Commercial PPO", date(2025, 2, 1)),
    ("P008", "G006", "Commercial PPO", date(2025, 2, 1)),
    ("P010", "G006", "Commercial PPO", date(2025, 2, 1)),
    # P009, P011 -> none yet (Scenario D will add them)
]


def _seed_reference_data(db: Session):
    """Groups, networks, providers, affiliations — static reference data, seeded once."""
    if db.query(models.Group).count() == 0:
        for group_id, name, tax_id, primary_county in GROUPS:
            db.add(models.Group(group_id=group_id, group_name=name, tax_id=tax_id,
                                primary_county=primary_county, status="Active"))

    if db.query(models.Network).count() == 0:
        for code, name, product_line, description in NETWORKS:
            db.add(models.Network(network_code=code, network_name=name,
                                   product_line=product_line, description=description))

    # Agreements must be seeded before Crosswalk (FK dependency)
    if db.query(models.Agreement).count() == 0:
        for agr_id, agr_name, group_id, network_code, eff, exp, status in AGREEMENTS:
            db.add(models.Agreement(
                agreement_id=agr_id, agreement_name=agr_name, group_id=group_id,
                network_code=network_code, effective_date=eff, expiration_date=exp, status=status,
            ))
    db.flush()

    if db.query(models.Crosswalk).count() == 0:
        for group_id, network_code, agreement_id, product_line in CROSSWALK:
            db.add(models.Crosswalk(group_id=group_id, network_code=network_code,
                                     agreement_id=agreement_id, product_line=product_line))

    if db.query(models.NetworkEligibilityRule).count() == 0:
        for rule_id, network_name, rule_type, rule_value, action_if_fails, notes in ELIGIBILITY_RULES:
            db.add(models.NetworkEligibilityRule(
                rule_id=rule_id, network_name=network_name, rule_type=rule_type,
                rule_value=rule_value, action_if_fails=action_if_fails, notes=notes,
            ))

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
    for provider_id, group_id, network_code, effective_date in PRE_DEMO_PARTICIPATIONS:
        db.add(models.ProviderParticipation(
            participation_id=str(uuid.uuid4()),
            provider_id=provider_id,
            network_code=network_code,
            agreement_id=agreement_for(group_id, network_code),
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
