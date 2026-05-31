from pydantic import BaseModel
from typing import Literal


class CategoryCreate(BaseModel):
    name: str
    color: str = "#6366f1"
    type: Literal["expense", "income"] = "expense"


class CategoryUpdate(BaseModel):
    type: Literal["expense", "income"]


class CategoryOut(BaseModel):
    id: int
    name: str
    color: str
    type: str

    model_config = {"from_attributes": True}
