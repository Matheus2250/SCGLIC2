from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.schemas.dashboard import DashboardPayload, DashboardOut
from app.schemas.usuario import Usuario
from app.services import dashboard_service

router = APIRouter()


@router.get("/{scope}", response_model=DashboardOut)
def get_dashboard(scope: str, db: Session = Depends(get_db), current_user: Usuario = Depends(deps.get_current_active_user)) -> Any:
    ud = dashboard_service.get_by_user_scope(db, user_id=str(current_user.id), scope=scope)
    if ud is None:
        # Default vazio
        return DashboardOut(scope=scope, widgets=[], layouts={}, updated_at=None)
    return DashboardOut(scope=scope, widgets=ud.widgets_json or [], layouts=ud.layouts_json or {}, updated_at=ud.updated_at)


@router.put("/{scope}", response_model=DashboardOut)
def put_dashboard(scope: str, payload: DashboardPayload, db: Session = Depends(get_db), current_user: Usuario = Depends(deps.get_current_active_user)) -> Any:
    try:
        ud = dashboard_service.upsert(db, user_id=str(current_user.id), scope=scope, widgets=payload.widgets or [], layouts=payload.layouts or {})
        return DashboardOut(scope=scope, widgets=ud.widgets_json or [], layouts=ud.layouts_json or {}, updated_at=ud.updated_at)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

