from fastapi import APIRouter, Depends, HTTPException, Query
from .. import crud, schemas
from ..dependencies import get_current_admin
from ..audit import event_manager
from typing import Optional, List

router = APIRouter()

@router.get("/", response_model=List[schemas.CarOut])
def read_cars(brand: Optional[str] = Query(None),
              min_price: Optional[float] = Query(None),
              max_price: Optional[float] = Query(None)):
    return crud.get_cars(brand=brand, min_price=min_price, max_price=max_price)

@router.get("/{car_id}", response_model=schemas.CarOut)
def read_car(car_id: int):
    car = crud.get_car(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return car

@router.post("/", response_model=schemas.CarOut)
def create_car(car_data: schemas.CarCreate, current_user=Depends(get_current_admin)):
    new_car = crud.create_car(car_data.dict())
    event_manager.notify("CAR_CREATED", {"admin": current_user["email"], "car_id": new_car["id"]})
    return new_car

@router.put("/{car_id}", response_model=schemas.CarOut)
def update_car(car_id: int, car_data: schemas.CarUpdate, current_user=Depends(get_current_admin)):
    updated = crud.update_car(car_id, car_data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Car not found")
    event_manager.notify("CAR_UPDATED", {"admin": current_user["email"], "car_id": car_id})
    return updated

@router.delete("/{car_id}")
def delete_car(car_id: int, current_user=Depends(get_current_admin)):
    car = crud.delete_car(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    event_manager.notify("CAR_DELETED", {"admin": current_user["email"], "car_id": car_id})
    return {"message": "Car deleted successfully"}