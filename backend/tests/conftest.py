"""Pytest 配置与共享夹具。"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app
from models import db
from seed import seed_database


@pytest.fixture()
def app():
    """创建测试用 Flask 应用，使用内存 SQLite 数据库。"""
    test_config = {
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    }
    app = create_app(test_config)

    with app.app_context():
        db.create_all()
        seed_database()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    """Flask 测试客户端。"""
    return app.test_client()


@pytest.fixture()
def runner(app):
    """Flask CLI 测试运行器。"""
    return app.test_cli_runner()


@pytest.fixture()
def db_session(app):
    """数据库会话，每个测试后回滚。"""
    with app.app_context():
        yield db.session
