from pydantic import BaseModel
from datetime import date
from typing import Optional
from app.models.transaction import TransactionType
from app.schemas.category import CategoryOut
from app.schemas.user import UserOut


class TransactionCreate(BaseModel):
    amount: float
    description: str
    date: date
    type: TransactionType = TransactionType.expense
    category_id: Optional[int] = None


class TransactionOut(BaseModel):
    id: int
    amount: float
    description: str
    date: date
    type: TransactionType
    user: UserOut
    category: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}
