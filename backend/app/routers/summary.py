from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import Optional
from app.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.models.user import User
from app.auth import get_current_user

router = APIRouter(prefix="/api/summary", tags=["summary"])


@router.get("")
def get_summary(
    month: Optional[str] = Query(None, description="e.g. 2024-01"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Transaction)
    if month:
        year, m = month.split("-")
        q = q.filter(
            extract("year", Transaction.date) == int(year),
            extract("month", Transaction.date) == int(m),
        )

    total_income = q.filter(Transaction.type == TransactionType.income).with_entities(
        func.sum(Transaction.amount)
    ).scalar() or 0.0

    total_expenses = q.filter(Transaction.type == TransactionType.expense).with_entities(
        func.sum(Transaction.amount)
    ).scalar() or 0.0

    by_category = (
        db.query(Category.name, Category.color, func.sum(Transaction.amount).label("total"))
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(Transaction.type == TransactionType.expense)
    )
    if month:
        year, m = month.split("-")
        by_category = by_category.filter(
            extract("year", Transaction.date) == int(year),
            extract("month", Transaction.date) == int(m),
        )
    by_category = by_category.group_by(Category.id).all()

    by_user = (
        db.query(User.name, func.sum(Transaction.amount).label("total"))
        .join(Transaction, Transaction.user_id == User.id)
        .filter(Transaction.type == TransactionType.expense)
    )
    if month:
        by_user = by_user.filter(
            extract("year", Transaction.date) == int(year),
            extract("month", Transaction.date) == int(m),
        )
    by_user = by_user.group_by(User.id).all()

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": total_income - total_expenses,
        "by_category": [{"name": r[0], "color": r[1], "total": r[2]} for r in by_category],
        "by_user": [{"name": r[0], "total": r[1]} for r in by_user],
    }
