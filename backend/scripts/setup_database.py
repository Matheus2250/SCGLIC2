import os
import sys
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# Adicionar o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

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
            print("SUCESSO - Banco de dados criado com sucesso!")
        else:
            print("SUCESSO - Banco de dados ja existe!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"ERRO ao criar banco: {e}")
        return False

if __name__ == "__main__":
    if create_database_if_not_exists():
        print("\nAgora execute: alembic upgrade head")