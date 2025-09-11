import psycopg2
import sys
import os

# Configurar encoding para Windows
if sys.platform == "win32":
    os.environ['PYTHONIOENCODING'] = 'utf-8'

print(f"Python encoding: {sys.getdefaultencoding()}")
print(f"Platform: {sys.platform}")

try:
    print("\nTestando conexao direta com psycopg2...")
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="123",
        database="postgres",
        client_encoding="UTF8"
    )
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"SUCESSO - Conectado! PostgreSQL: {version[0]}")
    
    cursor.execute("SELECT datname FROM pg_database;")
    databases = cursor.fetchall()
    print(f"\nBancos existentes: {[db[0] for db in databases]}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"ERRO: {e}")