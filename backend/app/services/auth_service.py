from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate
from app.core.security import get_password_hash, verify_password


def get_user(db: Session, user_id: str) -> Usuario:
    return db.query(Usuario).filter(Usuario.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Usuario:
    return db.query(Usuario).filter(Usuario.username == username).first()


def get_user_by_email(db: Session, email: str) -> Usuario:
    return db.query(Usuario).filter(Usuario.email == email).first()


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


def authenticate_user(db: Session, username: str, password: str) -> Usuario:
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user