from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.crud import products as product_crud
from app.database import get_db
from app.schemas.product import ProductCreate, ProductRead, ProductReplace, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    low_stock: bool = False,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> list[ProductRead]:
    return product_crud.list_products(db, low_stock=low_stock, threshold=settings.low_stock_threshold)


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> ProductRead:
    return product_crud.create_product(db, payload)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductRead:
    return product_crud.get_product(db, product_id)


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)) -> ProductRead:
    return product_crud.update_product(db, product_id, payload)


@router.put("/{product_id}", response_model=ProductRead)
def replace_product(product_id: int, payload: ProductReplace, db: Session = Depends(get_db)) -> ProductRead:
    return product_crud.replace_product(db, product_id, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> Response:
    product_crud.delete_product(db, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
