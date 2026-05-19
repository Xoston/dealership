from fastapi import APIRouter, Depends, HTTPException, Body
from .. import crud
from ..dependencies import get_current_admin
from ..audit import event_manager

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats")
def admin_stats(current_user=Depends(get_current_admin)):
    return crud.get_admin_stats()

@router.get("/users")
def list_users(current_user=Depends(get_current_admin)):
    return crud.get_all_users()

@router.put("/users/{user_id}/role")
def change_user_role(user_id: int, payload: dict = Body(...), current_user=Depends(get_current_admin)):
    new_role = payload.get("role")
    if new_role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    updated = crud.update_user_role(user_id, new_role)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    event_manager.notify("USER_ROLE_CHANGED", {"admin": current_user["email"], "user_id": user_id, "new_role": new_role})
    return updated

@router.delete("/users/{user_id}")
def remove_user(user_id: int, current_user=Depends(get_current_admin)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    success = crud.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found or is admin")
    event_manager.notify("USER_DELETED", {"admin": current_user["email"], "user_id": user_id})
    return {"message": "User deleted"}

@router.get("/loans")
def get_all_loan_applications(current_user=Depends(get_current_admin)):
    return crud.get_all_loan_applications()

@router.put("/loans/{loan_id}/status")
def update_loan_status(loan_id: int, payload: dict = Body(...), current_user=Depends(get_current_admin)):
    new_status = payload.get("status")
    if new_status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    updated = crud.update_loan_application_status(loan_id, new_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Loan application not found")
    event_manager.notify("LOAN_STATUS_CHANGED", {"admin": current_user["email"], "loan_id": loan_id, "new_status": new_status})
    return updated

@router.get("/export/{entity}")
def export_data(entity: str, current_user=Depends(get_current_admin)):
    import csv, io
    from fastapi.responses import StreamingResponse
    if entity == 'users':
        data = crud.get_all_users()
        fieldnames = ['id', 'email', 'role', 'full_name', 'phone', 'created_at']
    elif entity == 'cars':
        data = crud.get_cars()
        fieldnames = ['id', 'brand', 'model', 'year', 'price', 'body_type', 'restyling']
    elif entity == 'testdrives':
        data = crud.get_all_test_drives()
        fieldnames = ['id', 'user_id', 'car_id', 'preferred_date', 'status']
    elif entity == 'loans':
        data = crud.get_all_loan_applications()
        fieldnames = ['id', 'user_id', 'car_id', 'amount', 'term_months', 'monthly_payment', 'status']
    else:
        raise HTTPException(status_code=400, detail="Invalid entity")
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in data:
        writer.writerow({k: row.get(k) for k in fieldnames})
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={entity}.csv"})