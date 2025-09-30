from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.usuario import Usuario, NivelAcesso
from app.schemas.usuario import TokenData

security = HTTPBearer()


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(username=email)  # Keep the field name for compatibility
    except JWTError:
        raise credentials_exception

    user = db.query(Usuario).filter(Usuario.email == token_data.username).first()  # Search by email
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    if not current_user.ativo:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_admin_user(
    current_user: Usuario = Depends(get_current_active_user),
) -> Usuario:
    if current_user.nivel_acesso != NivelAcesso.COORDENADOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators (COORDENADOR) can perform this action"
        )
    return current_user


def get_user_with_write_access(
    current_user: Usuario = Depends(get_current_active_user),
) -> Usuario:
    """
    Get current user and ensure they have write access (not VISITANTE).
    VISITANTE users can only read data, not modify it.
    """
    if current_user.nivel_acesso == NivelAcesso.VISITANTE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Visitors (VISITANTE) can only view data. Write access denied."
        )
    return current_user


def get_user_with_module_access(module: str):
    """
    Factory function to create dependency that checks module-specific access.
    VISITANTE can see all modules but cannot modify data.
    """
    def check_module_access(
        current_user: Usuario = Depends(get_current_active_user),
    ) -> Usuario:
        # VISITANTE can view all modules but cannot write
        if current_user.nivel_acesso == NivelAcesso.VISITANTE:
            return current_user

        # Other users need specific module access
        module_permissions = {
            "planejamento": [NivelAcesso.COORDENADOR, NivelAcesso.DIPLAN, NivelAcesso.VISITANTE],
            "qualificacao": [NivelAcesso.COORDENADOR, NivelAcesso.DIQUALI],
            "licitacao": [NivelAcesso.COORDENADOR, NivelAcesso.DIPLI],
            "reports": [NivelAcesso.COORDENADOR, NivelAcesso.DIPLAN, NivelAcesso.DIQUALI, NivelAcesso.DIPLI, NivelAcesso.VISITANTE]
        }

        if module not in module_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Unknown module: {module}"
            )

        if current_user.nivel_acesso not in module_permissions[module]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied to {module} module"
            )

        return current_user

    return check_module_access