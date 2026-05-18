from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/upsert", response_model=UserOut)
async def upsert_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.telegram_id == data.telegram_id))
    if not user:
        user = User(**data.model_dump())
        db.add(user)
    else:
        user.first_name = data.first_name
        user.last_name = data.last_name
        user.username = data.username
    await db.commit()
    await db.refresh(user)
    return user
