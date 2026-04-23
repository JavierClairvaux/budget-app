from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    color: str = "#6366f1"


class CategoryOut(BaseModel):
    id: int
    name: str
    color: str

    model_config = {"from_attributes": True}
