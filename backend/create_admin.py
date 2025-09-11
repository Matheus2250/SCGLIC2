#!/usr/bin/env python3
"""
Script para criar usuário administrador inicial
"""
import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.usuario import Usuario, NivelAcesso
from app.core.security import get_password_hash

def create_admin_user():
    db = SessionLocal()
    try:
        # Verificar se já existe um admin
        existing_admin = db.query(Usuario).filter(Usuario.username == "admin").first()
        if existing_admin:
            print("Usuário admin já existe!")
            return
        
        # Criar usuário admin
        admin_user = Usuario(
            username="admin",
            email="admin@sistema.gov.br",
            password_hash=get_password_hash("admin123"),
            nome_completo="Administrador do Sistema",
            nivel_acesso=NivelAcesso.COORDENADOR,
            ativo=True
        )
        
        db.add(admin_user)
        db.commit()
        print("✅ Usuário admin criado com sucesso!")
        print("Username: admin")
        print("Password: admin123")
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()