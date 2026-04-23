from pydantic import BaseModel
from app.schemas.category import CategoryOut


class BudgetCreate(BaseModel):
    amount: float
    month: str  # "2024-01"
    category_id: int


class BudgetUpdate(BaseModel):
    amount: float
    apply_forward: bool = True


class BudgetOut(BaseModel):
    id: int
    amount: float
    month: str
    category: CategoryOut
    spent: float = 0.0

    model_config = {"from_attributes": True}
