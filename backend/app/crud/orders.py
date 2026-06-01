from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate


def list_orders(db: Session) -> list[Order]:
    stmt = (
        select(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    return list(db.scalars(stmt).unique().all())


def get_order(db: Session, order_id: int) -> Order:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
    )
    order = db.scalars(stmt).unique().one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return order


def create_order(db: Session, payload: OrderCreate) -> Order:
    customer = db.get(Customer, payload.customer_id)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    requested_quantities = {item.product_id: item.quantity for item in payload.items}
    products = _lock_products(db, list(requested_quantities))
    missing_ids = sorted(set(requested_quantities) - set(products))
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Products not found: {missing_ids}.",
        )

    insufficient = [
        {
            "product_id": product.id,
            "sku": product.sku,
            "available": product.quantity_in_stock,
            "requested": requested_quantities[product.id],
        }
        for product in products.values()
        if product.quantity_in_stock < requested_quantities[product.id]
    ]
    if insufficient:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Insufficient stock.", "items": insufficient},
        )

    order = Order(customer_id=payload.customer_id, status="confirmed", total_amount=Decimal("0.00"))
    db.add(order)

    total = Decimal("0.00")
    for product_id, quantity in requested_quantities.items():
        product = products[product_id]
        product.quantity_in_stock -= quantity
        line_total = product.price * quantity
        total += line_total
        db.add(
            OrderItem(
                order=order,
                product_id=product.id,
                quantity=quantity,
                unit_price=product.price,
            )
        )

    order.total_amount = total
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Order could not be created.") from exc

    return get_order(db, order.id)


def delete_order(db: Session, order_id: int) -> None:
    order = get_order(db, order_id)
    ordered_quantities = {item.product_id: item.quantity for item in order.items}
    products = _lock_products(db, list(ordered_quantities))

    for product_id, quantity in ordered_quantities.items():
        product = products.get(product_id)
        if product is not None:
            product.quantity_in_stock += quantity

    db.delete(order)
    db.commit()


def _lock_products(db: Session, product_ids: list[int]) -> dict[int, Product]:
    stmt = select(Product).where(Product.id.in_(product_ids)).with_for_update()
    return {product.id: product for product in db.scalars(stmt).all()}
