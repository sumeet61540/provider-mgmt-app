import logging
import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import seed
from database import Base, engine, get_db
from routers import audit, crosswalk, demo, participations, providers

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("provider-mgmt")

app = FastAPI(title="Provider Network Management EHR Simulator", version="1.0.0")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allowed_origins == "*" else allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(providers.router, prefix="/api/v1")
app.include_router(participations.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
app.include_router(demo.router, prefix="/api/v1")
app.include_router(crosswalk.router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed.run_seed(db)
    finally:
        db.close()
    logger.info("Provider Network Management EHR Simulator ready.")


@app.get("/")
def root():
    return {"name": "Provider Network Management EHR Simulator", "version": "1.0.0"}


@app.get("/api/v1/health")
def health(db: Session = Depends(get_db)):
    provider_count = db.query(func.count(models.Provider.id)).scalar()
    participation_count = db.query(func.count(models.ProviderParticipation.id)).scalar()
    return {
        "status": "ok",
        "db": "connected",
        "provider_count": provider_count,
        "participation_count": participation_count,
    }
