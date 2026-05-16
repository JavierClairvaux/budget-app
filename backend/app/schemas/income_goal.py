from pydantic import BaseModel


class IncomeGoalUpsert(BaseModel):
    amount: float
    month: str  # "2024-01"
    apply_forward: bool = True


class IncomeGoalOut(BaseModel):
    id: int
    amount: float
    month: str

    model_config = {"from_attributes": True}
