from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductReplace, ProductUpdate


def list_products(db: Session, *, low_stock: bool, threshold: int) -> list[Product]:
    stmt = select(Product).order_by(Product.name)
    if low_stock:
        stmt = stmt.where(Product.quantity_in_stock <= threshold)
    return list(db.scalars(stmt).all())


def get_product(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return product


def create_product(db: Session, payload: ProductCreate) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists.") from exc
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, payload: ProductUpdate) -> Product:
    product = get_product(db, product_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists.") from exc
    db.refresh(product)
    return product


def replace_product(db: Session, product_id: int, payload: ProductReplace) -> Product:
    product = get_product(db, product_id)
    for key, value in payload.model_dump().items():
        setattr(product, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists.") from exc
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    db.delete(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product cannot be deleted while it is referenced by an order.",
        ) from exc
