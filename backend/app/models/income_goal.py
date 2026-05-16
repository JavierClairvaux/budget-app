from sqlalchemy import Column, Integer, Float, String
from app.database import Base


class IncomeGoal(Base):
    __tablename__ = "income_goals"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    month = Column(String, unique=True, nullable=False)  # format: "2024-01"
