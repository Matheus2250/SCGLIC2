import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import psycopg2
from psycopg2 import sql

# Forçar UTF-8 no Windows
if sys.platform == "win32":
    import locale
    try:
        locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
    except:
        try:
            locale.setlocale(locale.LC_ALL, 'C.UTF-8')
        except:
            pass

from .config import settings

# Configuração com encoding explícito
SQLALCHEMY_DATABASE_URL = settings.database_url

# Adicionar parâmetros de conexão para Windows
if "?" not in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL += "?client_encoding=utf8"

# Engine com configurações específicas para Windows
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexão antes de usar
    pool_recycle=3600,   # Recicla conexões a cada hora
    echo=False,
    connect_args={
        "client_encoding": "utf8",
        "connect_timeout": 10,
        "options": "-c client_encoding=utf8"
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_database_if_not_exists():
    """Cria o banco de dados se não existir"""
    try:
        # Conectar ao PostgreSQL (banco postgres padrão)
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="postgres",
            password="123",
            database="postgres",
            client_encoding="UTF8"
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Verificar se o banco existe
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = 'sistema_contratacoes'"
        )
        exists = cursor.fetchone()
        
        if not exists:
            print("Criando banco de dados 'sistema_contratacoes'...")
            cursor.execute(
                sql.SQL("CREATE DATABASE {} WITH ENCODING 'UTF8'").format(
                    sql.Identifier('sistema_contratacoes')
                )
            )
            print("Banco de dados criado com sucesso!")
        else:
            print("Banco de dados já existe!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Erro ao criar banco: {e}")
        return False