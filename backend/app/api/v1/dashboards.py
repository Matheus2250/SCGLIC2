from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api import deps
from app.core.database import get_db
from app.schemas.usuario import Usuario
from pydantic import BaseModel, Field

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
    try:
        row = db.execute(
            text(
                """
                SELECT widgets_json, layouts_json, updated_at
                FROM user_dashboards
                WHERE user_id = :uid::uuid AND scope = :scope
                """
            ),
            {"uid": str(current_user.id), "scope": scope},
        ).fetchone()
    except Exception:
        # Se tabela nao existir ou erro inesperado, retorna vazio para nao quebrar a UI
        return DashboardOut(scope=scope, widgets=[], layouts={}, updated_at=None)
    if not row:
        return DashboardOut(scope=scope, widgets=[], layouts={}, updated_at=None)
    widgets, layouts, updated_at = row
    return DashboardOut(scope=scope, widgets=widgets or [], layouts=layouts or {}, updated_at=updated_at)


@router.put("/{scope}", response_model=DashboardOut)
def put_dashboard(scope: str, payload: DashboardPayload, db: Session = Depends(get_db), current_user: Usuario = Depends(deps.get_current_active_user)) -> Any:
    # Validacoes simples
    try:
        import json
        widgets_obj = payload.widgets or []
        layouts_obj = payload.layouts or {}
        body = json.dumps({"widgets": widgets_obj, "layouts": layouts_obj}).encode("utf-8")
        if len(body) > 200_000:
            raise HTTPException(status_code=400, detail="payload muito grande")
        if isinstance(widgets_obj, list) and len(widgets_obj) > 30:
            raise HTTPException(status_code=400, detail="limite de widgets excedido")
    except Exception:
        raise HTTPException(status_code=400, detail="payload invalido")

    # Persistir com SELECT -> UPDATE/INSERT e cast para JSONB
    import json as _json
    widgets_json = _json.dumps(widgets_obj)
    layouts_json = _json.dumps(layouts_obj)
    params = {"uid": str(current_user.id), "scope": scope, "widgets": widgets_json, "layouts": layouts_json}
    try:
        exists = db.execute(
            text("SELECT 1 FROM user_dashboards WHERE user_id = :uid::uuid AND scope = :scope"),
            params,
        ).fetchone()
        if exists:
            db.execute(
                text(
                    """
                    UPDATE user_dashboards
                    SET widgets_json = :widgets::jsonb,
                        layouts_json = :layouts::jsonb,
                        updated_at = now()
                    WHERE user_id = :uid::uuid AND scope = :scope
                    """
                ),
                params,
            )
        else:
            db.execute(
                text(
                    """
                    INSERT INTO user_dashboards (user_id, scope, widgets_json, layouts_json)
                    VALUES (:uid::uuid, :scope, :widgets::jsonb, :layouts::jsonb)
                    """
                ),
                params,
            )
        db.commit()
    except Exception as e:
        msg = str(e)
        if 'user_dashboards' in msg and 'does not exist' in msg:
            raise HTTPException(status_code=400, detail="Tabela de dashboards nao encontrada. Execute as migrations.")
        raise HTTPException(status_code=500, detail="Erro ao salvar dashboard")

    return get_dashboard(scope, db, current_user)


