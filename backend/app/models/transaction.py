from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class TransactionType(str, enum.Enum):
    expense = "expense"
    income = "income"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    type = Column(Enum(TransactionType), nullable=False, default=TransactionType.expense)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
