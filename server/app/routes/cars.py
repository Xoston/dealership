from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from .. import crud, schemas
from ..dependencies import get_current_admin_or_manager
from ..audit import event_manager
from ..cache import cached, invalidate_cache
from typing import Optional, List
import os
import shutil

router = APIRouter()
UPLOAD_DIR = "uploads"
limiter = Limiter(key_func=get_remote_address)

@router.get("/", response_model=List[schemas.CarOut])
@cached(ttl=30)
def read_cars(
    brand: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    body_type: Optional[str] = Query(None),
    restyling: Optional[bool] = Query(None),
    search: Optional[str] = Query(None)  # Добавлена поддержка сквозной поисковой строки
):
    return crud.get_cars(
        brand=brand, model=model,
        min_price=min_price, max_price=max_price,
        year_from=year_from, year_to=year_to,
        body_type=body_type, restyling=restyling,
        search=search
    )

@router.get("/{car_id}", response_model=schemas.CarOut)
#@cached(ttl=30)
def read_car(car_id: int):
    car = crud.get_car(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return car

# ------- НОВЫЙ ЭНДПОИНТ (получение изображений автомобиля) -------
@router.get("/{car_id}/images", response_model=List[schemas.CarImageOut])
def get_car_images(car_id: int):
    car = crud.get_car(car_id)          # проверяем, что авто существует
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return crud.get_car_images(car_id)  # сама функция уже есть в crud

@router.post("/", response_model=schemas.CarOut)
@limiter.limit("10/minute")
def create_car(request: Request, car_data: schemas.CarCreate, current_user=Depends(get_current_admin_or_manager)):
    new_car = crud.create_car(car_data.dict())
    invalidate_cache()
    event_manager.notify("CAR_CREATED", {"admin": current_user["email"], "car_id": new_car["id"]})
    return new_car

@router.put("/{car_id}", response_model=schemas.CarOut)
@limiter.limit("10/minute")
def update_car(request: Request, car_id: int, car_data: schemas.CarUpdate, current_user=Depends(get_current_admin_or_manager)):
    updated = crud.update_car(car_id, car_data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Car not found")
    invalidate_cache()
    event_manager.notify("CAR_UPDATED", {"admin": current_user["email"], "car_id": car_id})
    return updated

@router.delete("/{car_id}")
@limiter.limit("10/minute")
def delete_car(request: Request, car_id: int, current_user=Depends(get_current_admin_or_manager)):
    car = crud.delete_car(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    invalidate_cache()
    event_manager.notify("CAR_DELETED", {"admin": current_user["email"], "car_id": car_id})
    return {"message": "Car deleted successfully"}

@router.post("/upload_image")
def upload_image(file: UploadFile = File(...), current_user=Depends(get_current_admin_or_manager)):
    filename = f"{current_user['id']}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"image_url": f"/uploads/{filename}"}

@router.post("/{car_id}/images", response_model=schemas.CarImageOut)
def add_image(car_id: int, payload: dict, current_user=Depends(get_current_admin_or_manager)):
    car = crud.get_car(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    image_url = payload.get("image_url")
    if not image_url:
        raise HTTPException(status_code=400, detail="image_url is required")
    new_img = crud.add_car_image(car_id, image_url)
    invalidate_cache()
    event_manager.notify("IMAGE_ADDED", {"admin": current_user["email"], "car_id": car_id})
    return new_img

@router.delete("/images/{image_id}")
def delete_image(image_id: int, current_user=Depends(get_current_admin_or_manager)):
    crud.delete_car_image(image_id)
    invalidate_cache()
    return {"message": "Image deleted"}