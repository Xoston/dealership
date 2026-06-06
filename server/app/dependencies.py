from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from . import crud
from .auth import verify_token

# Указываем URL для получения токена (используется в OpenAPI-документации)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    # Декодируем токен из заголовка Authorization: Bearer <token>
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен"
        )
    
    email = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Некорректный токен (отсутствует email)"
        )
    
    user = crud.get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден"
        )
    
    return user

def get_current_admin(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Требуются права администратора")
    return current_user

def get_current_admin_or_manager(current_user=Depends(get_current_user)):
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Требуются права администратора или менеджера")
    return current_user