#!/usr/bin/env python3
"""
Script para rodar migrations do Alembic automaticamente no deploy
"""
import subprocess
import sys
import os

def run_migrations():
    """Roda as migrations do Alembic"""
    try:
        print("Iniciando migrations...")

        # Rodar upgrade do alembic
        result = subprocess.run([
            "alembic", "upgrade", "head"
        ], capture_output=True, text=True, cwd=os.getcwd())

        if result.returncode == 0:
            print("✅ Migrations executadas com sucesso!")
            print(result.stdout)
        else:
            print("❌ Erro nas migrations:")
            print(result.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"❌ Erro executando migrations: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()