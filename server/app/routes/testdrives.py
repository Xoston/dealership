from fastapi import APIRouter, Depends, HTTPException
from .. import crud, schemas
from ..dependencies import get_current_user, get_current_admin
from ..audit import event_manager
from typing import List

router = APIRouter()

@router.post("/", response_model=schemas.TestDriveRequestOut)
def create_test_drive(
    request_data: schemas.TestDriveRequestCreate,  # Теперь принимаем JSON body
    current_user=Depends(get_current_user)
):
    # Проверка существования автомобиля
    car = crud.get_car(request_data.car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    td = crud.create_test_drive(current_user["id"], request_data.dict())
    event_manager.notify("TESTDRIVE_REQUESTED", {
        "user": current_user["email"],
        "car_id": request_data.car_id
    })
    return td

@router.get("/my", response_model=List[schemas.TestDriveRequestOut])
def my_testdrives(current_user=Depends(get_current_user)):
    return crud.get_user_test_drives(current_user["id"])

@router.get("/all", response_model=List[schemas.TestDriveRequestOut])
def all_testdrives(current_user=Depends(get_current_admin)):
    return crud.get_all_test_drives()