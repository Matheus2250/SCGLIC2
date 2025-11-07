from fastapi import APIRouter, Depends
# pyright: reportMissingImports=false
"""
This file depends on FastAPI and SQLAlchemy runtime packages. If your editor
flags missing imports, ensure your Python interpreter points to the backend
virtualenv with these packages installed.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.pca import PCA
from app.models.qualificacao import Qualificacao
from app.models.licitacao import Licitacao
from app.models.usuario import Usuario

router = APIRouter()


def _user_name(u: Optional[Usuario]) -> str:
    if not u:
        return "Usuário"
    return u.nome_completo or u.email or "Usuário"


@router.get("/recent")
def recent_activities(limit: int = 20, db: Session = Depends(get_db)) -> List[dict]:
    limit = max(1, min(limit, 100))
    items: List[dict] = []

    # PCA
    pcas = db.query(PCA).order_by(PCA.created_at.desc()).limit(limit).all()
    for p in pcas:
        items.append({
            "module": "PCA",
            "action": "created",
            "title": f"{p.numero_contratacao} - {p.titulo_contratacao or ''}",
            "user": _user_name(p.creator),
            "at": p.created_at,
        })
        if p.updated_at and p.updated_at != p.created_at:
            items.append({
                "module": "PCA",
                "action": "updated",
                "title": f"{p.numero_contratacao} - {p.titulo_contratacao or ''}",
                "user": _user_name(getattr(p, "updater", None)),
                "at": p.updated_at,
            })

    # Qualificação
    quals = db.query(Qualificacao).order_by(Qualificacao.created_at.desc()).limit(limit).all()
    for q in quals:
        items.append({
            "module": "Qualificação",
            "action": "created",
            "title": f"{q.nup} - {q.objeto or ''}",
            "user": _user_name(q.creator),
            "at": q.created_at,
        })
        if q.updated_at and q.updated_at != q.created_at:
            items.append({
                "module": "Qualificação",
                "action": "updated",
                "title": f"{q.nup} - {q.objeto or ''}",
                "user": _user_name(getattr(q, "updater", None)),
                "at": q.updated_at,
            })

    # Licitação
    licits = db.query(Licitacao).order_by(Licitacao.created_at.desc()).limit(limit).all()
    for l in licits:
        items.append({
            "module": "Licitação",
            "action": "created",
            "title": f"{l.nup} - {l.status}",
            "user": _user_name(l.creator),
            "at": l.created_at,
        })
        if l.updated_at and l.updated_at != l.created_at:
            items.append({
                "module": "Licitação",
                "action": "updated",
                "title": f"{l.nup} - {l.status}",
                "user": _user_name(getattr(l, "updater", None)),
                "at": l.updated_at,
            })

    # Ordenar por data desc e limitar
    items.sort(key=lambda x: x.get("at") or datetime.min, reverse=True)
    return [
        {
            "module": it["module"],
            "action": it["action"],
            "title": it["title"],
            "user": it["user"],
            "at": (it["at"].isoformat() if isinstance(it["at"], datetime) else str(it["at"]))
        }
        for it in items[:limit]
    ]
