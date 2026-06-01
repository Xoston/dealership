from fastapi import APIRouter, Depends, HTTPException, Body
from .. import schemas, crud
from ..dependencies import get_current_user, get_current_admin_or_manager
from ..patterns.facade import LoanCalculatorFacade
from ..patterns.strategy import AnnuityStrategy
from ..audit import event_manager
from typing import List

router = APIRouter()
facade = LoanCalculatorFacade(strategy=AnnuityStrategy())

@router.post("/calculate", response_model=schemas.LoanCalculateResponse)
def calculate_loan(loan_data: schemas.LoanCalculateRequest,
                   current_user=Depends(get_current_user)):
    car = crud.get_car(loan_data.car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    result, app = facade.calculate_and_save(current_user["id"], loan_data)
    event_manager.notify("LOAN_CALCULATED", {
        "user": current_user["email"],
        "car_id": loan_data.car_id,
        "amount": loan_data.amount
    })
    return result

@router.get("/my", response_model=List[schemas.LoanApplicationOut])
def my_loans(current_user=Depends(get_current_user)):
    return crud.get_user_loan_applications(current_user["id"])

@router.get("/all", response_model=List[schemas.LoanApplicationOut])
def all_loans(current_user=Depends(get_current_admin_or_manager)):
    return crud.get_all_loan_applications()

@router.put("/{loan_id}/status", response_model=schemas.LoanApplicationOut)
def update_loan_status(loan_id: int, payload: dict = Body(...), current_user=Depends(get_current_admin_or_manager)):
    status = payload.get("status")
    comment = payload.get("comment", "")
    if not status:
        raise HTTPException(status_code=400, detail="Статус обязателен к заполнению")
        
    loan = crud.update_loan_status(loan_id, status, comment)
    if not loan:
        raise HTTPException(status_code=404, detail="Кредитная заявка не найдена")
        
    event_manager.notify("LOAN_STATUS_UPDATED", {"loan_id": loan_id, "status": status})
    return loan