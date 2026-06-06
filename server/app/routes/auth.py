from fastapi import APIRouter, Depends, HTTPException, Body
from .. import crud
from ..auth import verify_password, create_access_token, get_password_hash
from ..dependencies import get_current_user

router = APIRouter()

@router.post("/login")
def login(payload: dict = Body(...)):
    email = payload.get("email")
    password = payload.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email и пароль обязательны")
    user = crud.get_user_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    token = create_access_token(data={"sub": user["email"], "role": user["role"], "id": user["id"]})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/register")
def register(payload: dict = Body(...)):
    email = payload.get("email")
    password = payload.get("password")
    full_name = payload.get("full_name", "")
    phone = payload.get("phone", "")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email и пароль обязательны")
    existing = crud.get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    user = crud.create_user({
        "email": email,
        "password": password,
        "full_name": full_name,
        "phone": phone
    })
    token = create_access_token(data={"sub": user["email"], "role": user["role"], "id": user["id"]})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/logout")
def logout(current_user=Depends(get_current_user)):
    return {"message": "Вы вышли из системы"}

@router.get("/me")
def get_current_user_info(current_user=Depends(get_current_user)):
    return current_user

@router.put("/profile")
def update_profile(payload: dict = Body(...), current_user=Depends(get_current_user)):
    user_id = current_user["id"]
    full_name = payload.get("full_name")
    phone = payload.get("phone")
    updated = crud.update_user_profile(user_id, full_name, phone)
    if not updated:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return updated