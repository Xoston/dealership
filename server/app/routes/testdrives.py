from fastapi import APIRouter, Depends, HTTPException, Body
from .. import crud, schemas
from ..dependencies import get_current_user, get_current_admin_or_manager
from ..audit import event_manager
from typing import List

router = APIRouter()

@router.post("/", response_model=schemas.TestDriveRequestOut)
def create_test_drive(request_data: schemas.TestDriveRequestCreate, current_user=Depends(get_current_user)):
    car = crud.get_car(request_data.car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    td = crud.create_test_drive(current_user["id"], request_data.dict())
    event_manager.notify("TESTDRIVE_REQUESTED", {"user": current_user["email"], "car_id": request_data.car_id})
    return td

@router.get("/my", response_model=List[schemas.TestDriveRequestOut])
def my_testdrives(current_user=Depends(get_current_user)):
    return crud.get_user_test_drives(current_user["id"])

@router.get("/all", response_model=List[schemas.TestDriveRequestOut])
def all_testdrives(current_user=Depends(get_current_admin_or_manager)):
    return crud.get_all_test_drives()

@router.put("/{td_id}/status", response_model=schemas.TestDriveRequestOut)
def update_test_drive_status(td_id: int, payload: dict = Body(...), current_user=Depends(get_current_admin_or_manager)):
    status = payload.get("status")
    comment = payload.get("comment", "")
    if not status:
        raise HTTPException(status_code=400, detail="Статус обязателен к заполнению")
    
    td = crud.update_test_drive_status(td_id, status, comment)
    if not td:
        raise HTTPException(status_code=404, detail="Заявка на тест-драйв не найдена")
        
    event_manager.notify("TESTDRIVE_STATUS_UPDATED", {"td_id": td_id, "status": status})
    return td

@router.post("/review")
def submit_review(payload: dict = Body(...), current_user=Depends(get_current_user)):
    test_drive_id = payload.get("test_drive_id")
    rating = payload.get("rating")
    comment = payload.get("comment", "")
    if not test_drive_id or not rating:
        raise HTTPException(status_code=400, detail="test_drive_id и rating обязательны")
    return crud.create_review(current_user["id"], test_drive_id, rating, comment)