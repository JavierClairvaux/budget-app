from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.income_goal import IncomeGoal
from app.models.user import User
from app.schemas.income_goal import IncomeGoalUpsert, IncomeGoalOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/income-goals", tags=["income-goals"])


def _auto_copy_from_latest(month: str, db: Session):
    """If no goal exists for `month`, copy the most recent prior one."""
    existing = db.query(IncomeGoal).filter(IncomeGoal.month == month).first()
    if existing:
        return existing

    latest = (
        db.query(IncomeGoal)
        .filter(IncomeGoal.month < month)
        .order_by(IncomeGoal.month.desc())
        .first()
    )
    if not latest:
        return None

    copied = IncomeGoal(amount=latest.amount, month=month)
    db.add(copied)
    db.commit()
    db.refresh(copied)
    return copied


@router.get("", response_model=Optional[IncomeGoalOut])
def get_income_goal(
    month: str = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    goal = db.query(IncomeGoal).filter(IncomeGoal.month == month).first()
    if not goal:
        goal = _auto_copy_from_latest(month, db)
    return goal


@router.put("", response_model=IncomeGoalOut)
def upsert_income_goal(
    payload: IncomeGoalUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")

    goal = db.query(IncomeGoal).filter(IncomeGoal.month == payload.month).first()
    if goal:
        goal.amount = payload.amount
    else:
        goal = IncomeGoal(amount=payload.amount, month=payload.month)
        db.add(goal)

    if payload.apply_forward:
        db.query(IncomeGoal).filter(IncomeGoal.month > payload.month).update(
            {"amount": payload.amount}
        )

    db.commit()
    db.refresh(goal)
    return goal
