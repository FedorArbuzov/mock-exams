#!/usr/bin/env python3
"""CLI for sqlalchemy course labs."""

import argparse
import subprocess
import sys

from sqlalchemy import func, select, text

from shop.db import SyncSessionLocal, sync_engine
from shop.models import Category, Product


def cmd_health() -> int:
    with sync_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print('{"status":"ok","framework":"sqlalchemy-lab"}')
    return 0


def cmd_migrate() -> int:
    return subprocess.run(["alembic", "upgrade", "head"], check=False).returncode


def cmd_seed() -> int:
    with SyncSessionLocal() as session:
        if session.scalar(select(Category).limit(1)):
            print("already seeded")
            return 0
        books = Category(name="Books", slug="books")
        session.add(books)
        session.flush()
        session.add_all([
            Product(sku="BK-001", title="SQLAlchemy Guide", price="29.99", stock=50, category=books),
            Product(sku="BK-002", title="PostgreSQL Deep", price="39.99", stock=30, category=books),
        ])
        session.commit()
    print("seeded")
    return 0


def cmd_count() -> int:
    with SyncSessionLocal() as session:
        n = session.scalar(select(func.count()).select_from(Product))
    print(f"products={n}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="SQLAlchemy lab CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("health")
    sub.add_parser("migrate")
    sub.add_parser("seed")
    sub.add_parser("count")
    args = parser.parse_args()
    handlers = {
        "health": cmd_health,
        "migrate": cmd_migrate,
        "seed": cmd_seed,
        "count": cmd_count,
    }
    return handlers[args.cmd]()


if __name__ == "__main__":
    sys.exit(main())
