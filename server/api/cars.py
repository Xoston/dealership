from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import CarCreate, CarOut
from repository.car_repository import CarRepository
from middleware import get_admin_user
from audit import event_manager
from fastapi import Request

router = APIRouter(prefix="/api/cars", tags=["cars"])

@router.get("/", response_model=list[CarOut])
def list_cars(brand: str = None, min_price: float = None, max_price: float = None, db: Session = Depends(get_db)):
    repo = CarRepository(db)
    return repo.get_all(brand, min_price, max_price)

@router.get("/{car_id}", response_model=CarOut)
def get_car(car_id: int, db: Session = Depends(get_db)):
    repo = CarRepository(db)
    car = repo.get_by_id(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return car

@router.post("/", response_model=CarOut)
def create_car(car_data: CarCreate, request: Request, db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    repo = CarRepository(db)
    car = repo.create(car_data)
    event_manager.notify("car_created", {"user": admin.username, "ip": request.client.host, "result": "success"})
    return car

@router.put("/{car_id}", response_model=CarOut)
def update_car(car_id: int, car_data: CarCreate, request: Request, db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    repo = CarRepository(db)
    car = repo.update(car_id, car_data)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    event_manager.notify("car_updated", {"user": admin.username, "ip": request.client.host, "result": "success"})
    return car

@router.delete("/{car_id}", status_code=204)
def delete_car(car_id: int, request: Request, db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    repo = CarRepository(db)
    if not repo.delete(car_id):
        raise HTTPException(status_code=404, detail="Car not found")
    event_manager.notify("car_deleted", {"user": admin.username, "ip": request.client.host, "result": "success"})
    return  