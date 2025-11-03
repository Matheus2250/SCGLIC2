from datetime import timedelta
from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.schemas.usuario import Usuario, UsuarioCreate, UsuarioUpdate, Token
from app.services.auth_service import (
    authenticate_user, create_user, get_user_by_username, get_user_by_email,
    get_users, get_user, update_user, delete_user
)
from pydantic import BaseModel
import os
import uuid

router = APIRouter()


@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    email = form_data.username  # FastAPI OAuth2PasswordRequestForm uses 'username' field, but we'll treat it as email
    password = form_data.password
    user = authenticate_user(db, email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    return {
        "access_token": security.create_access_token(
            user.email, expires_delta=access_token_expires  # Use email instead of username for token
        ),
        "token_type": "bearer",
    }


@router.post("/register", response_model=Usuario)
def create_user_account(
    user_in: UsuarioCreate,
    db: Session = Depends(get_db)
) -> Any:
    # Only check for email uniqueness, username can be duplicated
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system."
        )
    user = create_user(db, user_in)
    return user


@router.get("/me", response_model=Usuario)
def read_users_me(
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    return current_user


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.patch("/me", response_model=Usuario)
def update_me(
    user_in: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    # Permitir apenas atualização de nome e email pelo próprio usuário
    allowed = {"nome_completo", "email"}
    data = {k: v for k, v in user_in.dict(exclude_unset=True).items() if k in allowed}
    if not data:
        return current_user
    updated = update_user(db, user_id=current_user.id, user_update=UsuarioUpdate(**data))
    return updated


@router.post("/change-password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    if not security.verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    current_user.password_hash = security.get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Senha atualizada com sucesso"}


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    # Validar tipo simples
    filename = file.filename or "avatar"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in {'.jpg', '.jpeg', '.png', '.webp', '.gif'}:
        raise HTTPException(status_code=400, detail="Formato de imagem inválido")

    # Garantir diretório
    static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'static')
    avatars_dir = os.path.join(static_dir, 'avatars')
    os.makedirs(avatars_dir, exist_ok=True)

    unique_name = f"{uuid.uuid4()}{ext}"
    dest_path = os.path.join(avatars_dir, unique_name)

    with open(dest_path, 'wb') as out:
        out.write(await file.read())

    url = f"/static/avatars/{unique_name}"
    current_user.avatar_url = url
    db.add(current_user)
    db.commit()
    return {"avatar_url": url}


# Endpoints de administração de usuários (apenas para COORDENADOR)
@router.get("/users", response_model=List[Usuario])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(deps.get_admin_user)
) -> Any:
    """
    Retrieve all users. Only accessible by COORDENADOR.
    """
    users = get_users(db, skip=skip, limit=limit)
    return users


@router.get("/users/{user_id}", response_model=Usuario)
def read_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(deps.get_admin_user)
) -> Any:
    """
    Get a specific user by ID. Only accessible by COORDENADOR.
    """
    user = get_user(db, user_id=str(user_id))
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return user


@router.put("/users/{user_id}", response_model=Usuario)
def update_user_by_id(
    user_id: UUID,
    user_in: UsuarioUpdate,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(deps.get_admin_user)
) -> Any:
    """
    Update a user. Only accessible by COORDENADOR.
    """
    user = update_user(db, user_id=user_id, user_update=user_in)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return user


@router.delete("/users/{user_id}")
def delete_user_by_id(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(deps.get_admin_user)
) -> Any:
    """
    Delete a user. Only accessible by COORDENADOR.
    """
    try:
        print(f"[DELETE USER] Attempting to delete user: {user_id}")
        print(f"[DELETE USER] Admin user: {admin_user.email}")

        success = delete_user(db, user_id=user_id)
        if not success:
            print(f"[DELETE USER] User not found: {user_id}")
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        print(f"[DELETE USER] User deleted successfully: {user_id}")
        return {"message": "User deleted successfully"}
    except Exception as e:
        print(f"[DELETE USER] Error deleting user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
