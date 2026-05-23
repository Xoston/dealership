from fastapi import APIRouter, Depends, HTTPException, Body
from .. import crud
from ..dependencies import get_current_admin
from ..audit import event_manager
from ..cache import cached

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats")
@cached(ttl=30)
def admin_stats(current_user=Depends(get_current_admin)):
    return crud.get_admin_stats()

@router.get("/users")
def list_users(current_user=Depends(get_current_admin)):
    return crud.get_all_users()

@router.put("/users/{user_id}/role")
def change_user_role(user_id: int, payload: dict = Body(...), current_user=Depends(get_current_admin)):
    new_role = payload.get("role")
    if not new_role or not isinstance(new_role, str) or new_role.strip() == "":
        raise HTTPException(status_code=400, detail="Role must be a non-empty string")
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

# ---------- Кредитные заявки ----------
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

# ---------- Заявки на тест-драйв ----------
@router.put("/testdrives/{td_id}/status")
def update_testdrive_status(td_id: int, payload: dict = Body(...), current_user=Depends(get_current_admin)):
    new_status = payload.get("status")
    if new_status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    updated = crud.update_test_drive_status(td_id, new_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Test drive request not found")
    event_manager.notify("TESTDRIVE_STATUS_CHANGED", {"admin": current_user["email"], "td_id": td_id, "new_status": new_status})
    return updated