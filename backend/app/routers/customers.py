from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.crud import customers as customer_crud
from app.database import get_db
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerRead])
def list_customers(db: Session = Depends(get_db)) -> list[CustomerRead]:
    return customer_crud.list_customers(db)


@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)) -> CustomerRead:
    return customer_crud.create_customer(db, payload)


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: int, db: Session = Depends(get_db)) -> CustomerRead:
    return customer_crud.get_customer(db, customer_id)


@router.patch("/{customer_id}", response_model=CustomerRead)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)) -> CustomerRead:
    return customer_crud.update_customer(db, customer_id, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)) -> Response:
    customer_crud.delete_customer(db, customer_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
