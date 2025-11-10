from datetime import timedelta
from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response, Header
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
import hashlib

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
    # Configurações
    max_bytes = int(os.getenv("AVATAR_MAX_BYTES", "2000000"))  # 2 MB
    allowed_exts = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    mime_by_ext = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
    }

    filename = file.filename or "avatar"
    ext = os.path.splitext(filename)[1].lower()
    content_type = (getattr(file, 'content_type', None) or mime_by_ext.get(ext) or '').lower()
    if ext not in allowed_exts and content_type not in mime_by_ext.values():
        raise HTTPException(status_code=400, detail="Formato de imagem inválido")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Arquivo vazio")
    if len(data) > max_bytes:
        raise HTTPException(status_code=400, detail="Imagem excede o tamanho máximo permitido")

    current_user.avatar_blob = data
    current_user.avatar_mime = content_type or mime_by_ext.get(ext) or 'application/octet-stream'
    current_user.avatar_url = f"/api/v1/auth/avatar/{current_user.id}"
    db.add(current_user)
    db.commit()
    return {"avatar_url": current_user.avatar_url}


@router.get("/avatar/{user_id}")
def get_avatar(
    user_id: UUID,
    db: Session = Depends(get_db),
    if_none_match: Optional[str] = Header(default=None, convert_underscores=False),
) -> Response:
    user = get_user(db, user_id=str(user_id))
    if not user or not getattr(user, 'avatar_blob', None):
        raise HTTPException(status_code=404, detail="Avatar não encontrado")

    blob: bytes = user.avatar_blob
    mime: str = (user.avatar_mime or 'application/octet-stream')
    etag = 'W/"' + hashlib.sha1(blob).hexdigest() + '"'
    if if_none_match and if_none_match == etag:
        return Response(status_code=304)
    resp = Response(content=blob, media_type=mime)
    resp.headers['ETag'] = etag
    return resp


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

