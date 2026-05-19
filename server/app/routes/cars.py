from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from .. import crud, schemas
from ..dependencies import get_current_admin
from ..audit import event_manager
from typing import Optional, List
import os, shutil

router = APIRouter()
UPLOAD_DIR = "uploads"

# ---------- Статические маршруты (должны быть выше динамических) ----------
@router.get("/", response_model=List[schemas.CarOut])
def read_cars(
    brand: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    body_type: Optional[str] = Query(None),
    restyling: Optional[bool] = Query(None)
):
    return crud.get_cars(
        brand=brand, model=model,
        min_price=min_price, max_price=max_price,
        year_from=year_from, year_to=year_to,
        body_type=body_type, restyling=restyling
    )

@router.post("/upload_image")
def upload_image(file: UploadFile = File(...), current_user=Depends(get_current_admin)):
    filename = f"{current_user['id']}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"image_url": f"/uploads/{filename}"}

@router.delete("/images/{image_id}")
def delete_image(image_id: int, current_user=Depends(get_current_admin)):
    crud.delete_car_image(image_id)
    return {"message": "Image deleted"}

# ---------- Динамический маршрут получения одного автомобиля ----------
@router.get("/{car_id}", response_model=schemas.CarOut)
def read_car(car_id: int):
    car = crud.get_car(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return car

# ---------- Остальные CRUD операции ----------
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

@router.post("/{car_id}/images", response_model=schemas.CarImageOut)
def add_image(car_id: int, payload: dict, current_user=Depends(get_current_admin)):
    car = crud.get_car(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    image_url = payload.get("image_url")
    if not image_url:
        raise HTTPException(status_code=400, detail="image_url is required")
    new_img = crud.add_car_image(car_id, image_url)
    event_manager.notify("IMAGE_ADDED", {"admin": current_user["email"], "car_id": car_id})
    return new_img