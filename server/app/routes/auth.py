from fastapi import APIRouter, HTTPException, Depends, Body
from .. import crud, schemas, auth as auth_utils
from ..dependencies import get_current_user
from ..audit import event_manager
from ..database import get_connection

router = APIRouter()

@router.post("/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate):
    if crud.get_user_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = crud.create_user(user_data.dict())
    access_token = auth_utils.create_access_token(data={"sub": new_user["email"], "role": new_user["role"]})
    event_manager.notify("USER_REGISTERED", {"email": new_user["email"]})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin):
    user = crud.get_user_by_email(login_data.email)
    if not user or not auth_utils.verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = auth_utils.create_access_token(data={"sub": user["email"], "role": user["role"]})
    event_manager.notify("USER_LOGIN", {"email": user["email"]})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user=Depends(get_current_user)):
    return current_user

@router.put("/me")
def update_profile(payload: dict = Body(...), current_user=Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET full_name = ?, phone = ? WHERE id = ?",
        (payload.get("full_name", current_user["full_name"]),
         payload.get("phone", current_user["phone"]),
         current_user["id"])
    )
    conn.commit()
    conn.close()
    updated_user = crud.get_user_by_id(current_user["id"])
    return updated_user