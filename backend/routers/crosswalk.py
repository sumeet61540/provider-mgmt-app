from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/crosswalk", tags=["crosswalk"])


@router.get("", response_model=list[schemas.CrosswalkOut])
def list_crosswalk(
    group_id: Optional[str] = None,
    network_code: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Crosswalk, models.Group, models.Network)
        .join(models.Group, models.Group.group_id == models.Crosswalk.group_id)
        .join(models.Network, models.Network.network_code == models.Crosswalk.network_code)
    )
    if group_id:
        query = query.filter(models.Crosswalk.group_id == group_id)
    if network_code:
        query = query.filter(models.Crosswalk.network_code == network_code)

    rows = query.order_by(models.Crosswalk.group_id, models.Crosswalk.network_code).all()
    return [
        schemas.CrosswalkOut(
            group_id=cw.group_id,
            group_name=group.group_name,
            network_code=cw.network_code,
            network_name=network.network_name,
            agreement_id=cw.agreement_id,
            product_line=cw.product_line,
        )
        for cw, group, network in rows
    ]
