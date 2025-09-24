#!/usr/bin/env python3
"""
Script para criar usuário administrador inicial na produção
"""
import os
import sys
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.usuario import Usuario, NivelAcesso
from app.core.security import get_password_hash

def create_admin_user():
    # Use a URL específica da produção
    database_url = "postgresql://sistema_db_e6zp_user:kF9bprc89dNFlQTuNIG2tgMUl5jd1ftj@dpg-d3a2j4emcj7s73e36740-a.oregon-postgres.render.com/sistema_db_e6zp"

    print("Conectando ao banco de producao...")

    try:
        # Create engine for production database
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        # Verificar se já existe um admin
        existing_admin = db.query(Usuario).filter(Usuario.username == "admin").first()
        if existing_admin:
            print("Usuario admin ja existe na producao!")
            print(f"   Username: {existing_admin.username}")
            print(f"   Email: {existing_admin.email}")
            print(f"   Nome: {existing_admin.nome_completo}")
            print(f"   Nivel: {existing_admin.nivel_acesso}")
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
        print("Usuario admin criado com sucesso na producao!")
        print("   Username: admin")
        print("   Password: admin123")
        print("   Email: admin@sistema.gov.br")

    except Exception as e:
        print(f"Erro ao criar usuario na producao: {e}")
        if 'db' in locals():
            db.rollback()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    print("Script para criacao de usuario administrador na PRODUCAO")
    print("=" * 60)
    create_admin_user()