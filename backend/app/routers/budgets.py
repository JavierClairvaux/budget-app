from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import List, Optional
from app.database import get_db
from app.models.budget import Budget
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


def _attach_spent(budgets: list[Budget], db: Session) -> list[dict]:
    result = []
    for b in budgets:
        year, month = b.month.split("-")
        spent = (
            db.query(Transaction)
            .filter(
                Transaction.category_id == b.category_id,
                Transaction.type == TransactionType.expense,
                extract("year", Transaction.date) == int(year),
                extract("month", Transaction.date) == int(month),
            )
            .with_entities(Transaction.amount)
            .all()
        )
        result.append({**b.__dict__, "spent": sum(r[0] for r in spent), "category": b.category})
    return result


def _auto_copy_from_latest(month: str, db: Session):
    """If no budgets exist for `month`, copy from the most recent month that has budgets."""
    existing = db.query(Budget).filter(Budget.month == month).first()
    if existing:
        return

    latest = (
        db.query(Budget)
        .filter(Budget.month < month)
        .order_by(Budget.month.desc())
        .first()
    )
    if not latest:
        return

    latest_month = latest.month
    source_budgets = db.query(Budget).filter(Budget.month == latest_month).all()
    for b in source_budgets:
        db.add(Budget(amount=b.amount, month=month, category_id=b.category_id))
    db.commit()


@router.get("", response_model=List[BudgetOut])
def list_budgets(
    month: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if month:
        _auto_copy_from_latest(month, db)
    q = db.query(Budget)
    if month:
        q = q.filter(Budget.month == month)
    return _attach_spent(q.all(), db)


@router.post("", response_model=BudgetOut, status_code=201)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    budget = Budget(**payload.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _attach_spent([budget], db)[0]


@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Not found")
    budget.amount = payload.amount
    if payload.apply_forward:
        db.query(Budget).filter(
            Budget.category_id == budget.category_id,
            Budget.month > budget.month,
        ).update({"amount": payload.amount})
    db.commit()
    db.refresh(budget)
    return _attach_spent([budget], db)[0]


@router.delete("/{budget_id}", status_code=204)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(budget)
    db.commit()
