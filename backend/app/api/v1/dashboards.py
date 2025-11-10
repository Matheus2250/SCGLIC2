from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api import deps
from app.core.database import get_db
from app.schemas.usuario import Usuario
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

router = APIRouter()


class DashboardPayload(BaseModel):
    widgets: List[Any] = Field(default_factory=list)
    layouts: Dict[str, Any] = Field(default_factory=dict)


class DashboardOut(BaseModel):
    scope: str
    widgets: List[Any]
    layouts: Dict[str, Any]
    updated_at: Optional[Any] = None


@router.get("/{scope}", response_model=DashboardOut)
def get_dashboard(scope: str, db: Session = Depends(get_db), current_user: Usuario = Depends(deps.get_current_active_user)) -> Any:
    row = db.execute(
        text("""
            SELECT widgets_json, layouts_json, updated_at
            FROM user_dashboards
            WHERE user_id = :uid AND scope = :scope
        """),
        {"uid": str(current_user.id), "scope": scope},
    ).fetchone()
    if not row:
        return DashboardOut(scope=scope, widgets=[], layouts={}, updated_at=None)
    widgets, layouts, updated_at = row
    return DashboardOut(scope=scope, widgets=widgets or [], layouts=layouts or {}, updated_at=updated_at)


@router.put("/{scope}", response_model=DashboardOut)
def put_dashboard(scope: str, payload: DashboardPayload, db: Session = Depends(get_db), current_user: Usuario = Depends(deps.get_current_active_user)) -> Any:
    # Validações simples
    try:
        import json
        body = json.dumps({"widgets": payload.widgets or [], "layouts": payload.layouts or {}}).encode("utf-8")
        if len(body) > 200_000:
            raise HTTPException(status_code=400, detail="payload muito grande")
        if isinstance(payload.widgets, list) and len(payload.widgets) > 30:
            raise HTTPException(status_code=400, detail="limite de widgets excedido")
    except Exception:
        raise HTTPException(status_code=400, detail="payload inválido")

    # UPSERT
    db.execute(
        text(
            """
            INSERT INTO user_dashboards (user_id, scope, widgets_json, layouts_json)
            VALUES (:uid, :scope, :widgets, :layouts)
            ON CONFLICT (user_id, scope)
            DO UPDATE SET widgets_json = EXCLUDED.widgets_json,
                          layouts_json = EXCLUDED.layouts_json,
                          updated_at = now()
            """
        ),
        {"uid": str(current_user.id), "scope": scope, "widgets": payload.widgets or [], "layouts": payload.layouts or {}},
    )
    db.commit()

    return get_dashboard(scope, db, current_user)
