from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    color = Column(String, default="#6366f1")

    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")
