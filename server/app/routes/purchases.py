from fastapi import APIRouter, Depends, HTTPException, Body
from .. import crud
from ..dependencies import get_current_user
from ..audit import event_manager

router = APIRouter()

# ---- ЗАГЛУШКА: Все заявки (исправляет ошибку 404 по пути /api/applications) ----
@router.get("/")
def get_all_applications(current_user=Depends(get_current_user)):
    return []

@router.post("/")
def purchase_car(payload: dict = Body(...), current_user=Depends(get_current_user)):
    car_id = payload.get("car_id")
    if not car_id:
        raise HTTPException(status_code=400, detail="car_id is required")
    car = crud.get_car(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    purchase = crud.create_purchase(current_user["id"], car_id, car["price"])
    event_manager.notify("PURCHASE_MADE", {
        "user": current_user["email"],
        "car_id": car_id,
        "price": car["price"]
    })
    return {"message": "Purchase successful", "purchase": purchase}

@router.get("/my")
def my_purchases(current_user=Depends(get_current_user)):
    return crud.get_user_purchases(current_user["id"])