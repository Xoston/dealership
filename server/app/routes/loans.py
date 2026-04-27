from fastapi import APIRouter, Depends, HTTPException
from .. import schemas, crud
from ..dependencies import get_current_user
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