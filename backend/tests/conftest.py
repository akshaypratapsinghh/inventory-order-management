from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_ims.db")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
os.environ.setdefault("LOW_STOCK_THRESHOLD", "10")

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture()
def client() -> TestClient:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)
