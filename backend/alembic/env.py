from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.database import Base
from app.models import usuario, pca, qualificacao, licitacao

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    # Use DATABASE_URL environment variable if available
    url = os.environ.get("DATABASE_URL") or config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Use DATABASE_URL environment variable if available
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        # Create engine directly from DATABASE_URL
        from sqlalchemy import create_engine
        connectable = create_engine(database_url, poolclass=pool.NullPool)
    else:
        # Fallback to alembic.ini configuration
        connectable = engine_from_config(
            config.get_section(config.config_ini_section),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()