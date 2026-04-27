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