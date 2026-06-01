from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models.customer import Customer
from app.models.product import Product


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.scalar(select(Product.id).limit(1)) is not None:
            return

        db.add_all(
            [
                Product(
                    sku="SKU-1001",
                    name="Wireless Barcode Scanner",
                    description="Handheld 2D scanner for receiving and dispatch.",
                    price=Decimal("129.00"),
                    quantity_in_stock=18,
                ),
                Product(
                    sku="SKU-1002",
                    name="Thermal Label Roll",
                    description="4 x 6 shipping labels, 500 labels per roll.",
                    price=Decimal("14.50"),
                    quantity_in_stock=8,
                ),
                Product(
                    sku="SKU-1003",
                    name="Packing Tape Case",
                    description="Clear tape, 36 rolls per case.",
                    price=Decimal("72.00"),
                    quantity_in_stock=24,
                ),
                Customer(
                    name="Acme Fulfillment",
                    email="ops@acme-fulfillment.example",
                    phone="+1-555-0142",
                    address="120 Market Street, Austin, TX",
                ),
                Customer(
                    name="Northwind Supply",
                    email="orders@northwind.example",
                    phone="+1-555-0198",
                    address="55 Harbor Road, Seattle, WA",
                ),
            ]
        )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
