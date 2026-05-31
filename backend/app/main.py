from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.database import Base, engine
from app.routers import auth, transactions, categories, budgets, summary, users
from sqlalchemy import text

Base.metadata.create_all(bind=engine)

# Lightweight migration: add `type` column to categories if missing (SQLite)
with engine.connect() as conn:
    cols = [r[1] for r in conn.execute(text("PRAGMA table_info(categories)")).fetchall()]
    if "type" not in cols:
        conn.execute(text("ALTER TABLE categories ADD COLUMN type VARCHAR NOT NULL DEFAULT 'expense'"))
        conn.commit()
    conn.execute(text("DROP TABLE IF EXISTS income_goals"))
    conn.commit()

app = FastAPI(title="Family Budget App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(budgets.router)
app.include_router(summary.router)
app.include_router(users.router)
