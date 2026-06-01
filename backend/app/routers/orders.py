from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.crud import orders as order_crud
from app.database import get_db
from app.schemas.order import OrderCreate, OrderRead

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderRead])
def list_orders(db: Session = Depends(get_db)) -> list[OrderRead]:
    return order_crud.list_orders(db)


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> OrderRead:
    return order_crud.create_order(db, payload)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)) -> OrderRead:
    return order_crud.get_order(db, order_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)) -> Response:
    order_crud.delete_order(db, order_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
