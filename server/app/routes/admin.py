from fastapi import APIRouter, Depends, HTTPException, Body
from .. import crud
from ..dependencies import get_current_admin, get_current_admin_or_manager
from ..audit import event_manager
from ..cache import cached

router = APIRouter()

# ---- ЗАГЛУШКА: Новые заявки ----
@router.get("/applications/new")
def get_new_applications(current_user=Depends(get_current_admin_or_manager)):
    return []

# ---- Статистика ----
@router.get("/stats")
@cached(ttl=30)
def admin_stats(current_user=Depends(get_current_admin_or_manager)):
    return crud.get_admin_stats()

# ---- Пользователи (только admin) ----
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

# ---- Кредитные заявки ----
@router.get("/loans")
def get_all_loan_applications(current_user=Depends(get_current_admin_or_manager)):
    return crud.get_all_loan_applications()

@router.put("/loans/{loan_id}/status")
def update_loan_status(loan_id: int, payload: dict = Body(...), current_user=Depends(get_current_admin_or_manager)):
    new_status = payload.get("status")
    if new_status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    comment = payload.get("comment", "")
    updated = crud.update_loan_application_status(loan_id, new_status, comment)
    if not updated:
        raise HTTPException(status_code=404, detail="Loan application not found")
        
    # Добавили передачу user_id
    event_manager.notify("LOAN_STATUS_CHANGED", {
        "admin": current_user["email"], 
        "loan_id": loan_id, 
        "new_status": new_status,
        "user_id": updated.get("user_id")
    })
    return updated

# ---- Заявки на тест-драйв ----
@router.options("/testdrives/{td_id}/status")
def options_testdrive_status():
    return {"message": "OK"}

@router.put("/testdrives/{td_id}/status")
def update_testdrive_status(td_id: int, payload: dict = Body(...), current_user=Depends(get_current_admin_or_manager)):
    new_status = payload.get("status")
    if new_status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    comment = payload.get("comment", "")
    updated = crud.update_test_drive_status(td_id, new_status, comment)
    if not updated:
        raise HTTPException(status_code=404, detail="Test drive request not found")
        
    # Добавили передачу user_id
    event_manager.notify("TESTDRIVE_STATUS_CHANGED", {
        "admin": current_user["email"], 
        "td_id": td_id, 
        "new_status": new_status,
        "user_id": updated.get("user_id")
    })
    return updated