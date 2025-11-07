from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from uuid import UUID
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate
from app.core.security import get_password_hash, verify_password


def get_user(db: Session, user_id: str) -> Usuario:
    return db.query(Usuario).filter(Usuario.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Usuario:
    return db.query(Usuario).filter(Usuario.username == username).first()


def get_user_by_email(db: Session, email: str) -> Usuario:
    return db.query(Usuario).filter(Usuario.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[Usuario]:
    return db.query(Usuario).offset(skip).limit(limit).all()


def create_user(db: Session, user: UsuarioCreate) -> Usuario:
    hashed_password = get_password_hash(user.password)
    db_user = Usuario(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        nome_completo=user.nome_completo,
        nivel_acesso=user.nivel_acesso,
        ativo=user.ativo
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: UUID, user_update: UsuarioUpdate) -> Optional[Usuario]:
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        return None

    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: UUID) -> bool:
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        return False

    # Clean up AccessRequest references to avoid NOT NULL violations
    try:
        from app.models.access_request import AccessRequest
        # Nullify approvals made by this user
        db.query(AccessRequest).filter(AccessRequest.aprovado_por_id == user_id).update({"aprovado_por_id": None}, synchronize_session=False)
        # Remove requests created by this user
        db.query(AccessRequest).filter(AccessRequest.user_id == user_id).delete(synchronize_session=False)
        db.flush()
    except Exception:
        # Do not fail deletion due to cleanup hiccups; proceed to attempt delete
        pass

    try:
        db.delete(db_user)
        db.commit()
        return True
    except IntegrityError:
        # If there are remaining FK references (e.g., created_by in other tables), fall back to soft delete
        db.rollback()
        try:
            db_user.ativo = False
            db.add(db_user)
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False


def authenticate_user(db: Session, email: str, password: str) -> Usuario:
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user
