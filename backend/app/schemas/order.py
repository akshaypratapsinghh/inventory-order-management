from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.customer import CustomerRead
from app.schemas.product import ProductRead


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def product_ids_must_be_unique(self) -> "OrderCreate":
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Order cannot contain duplicate product IDs.")
        return self


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: ProductRead

    model_config = ConfigDict(from_attributes=True)


class OrderRead(BaseModel):
    id: int
    customer_id: int
    status: str
    total_amount: Decimal
    created_at: datetime
    customer: CustomerRead
    items: list[OrderItemRead]

    model_config = ConfigDict(from_attributes=True)
