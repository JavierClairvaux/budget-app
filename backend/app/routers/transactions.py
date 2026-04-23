from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import Optional, List
from datetime import date
from app.database import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=List[TransactionOut])
def list_transactions(
    month: Optional[str] = Query(None, description="Filter by month, e.g. 2024-01"),
    category_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Transaction)
    if month:
        year, m = month.split("-")
        q = q.filter(
            extract("year", Transaction.date) == int(year),
            extract("month", Transaction.date) == int(m),
        )
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    if user_id:
        q = q.filter(Transaction.user_id == user_id)
    return q.order_by(Transaction.date.desc()).all()


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = Transaction(**payload.model_dump(), user_id=current_user.id)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Not found")
    if tx.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(tx)
    db.commit()
