from fastapi import FastAPI, Request, WebSocket, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .database import init_db
from .routes import cars, auth, loans, testdrives, purchases, admin, chat
from .audit import event_manager, FileLoggerObserver, NotificationObserver
from .auth import verify_token
from .ws_manager import ws_manager
from starlette.websockets import WebSocketDisconnect
import os

limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

app = FastAPI(title="Luxury Car Dealership API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Раздача статических файлов из папки uploads и images
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
os.makedirs("images", exist_ok=True)
app.mount("/images", StaticFiles(directory="images"), name="images")

file_logger = FileLoggerObserver("audit.log")
notification_logger = NotificationObserver()

event_manager.subscribe(file_logger)
event_manager.subscribe(notification_logger)

# Подключение роутеров системы
app.include_router(cars.router, prefix="/api/cars", tags=["cars"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(loans.router, prefix="/api/loans", tags=["loans"])
app.include_router(testdrives.router, prefix="/api/testdrives", tags=["testdrives"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

# Роутер заявок и покупок (дублируем префиксы, чтобы фронтенд успешно стучался и на /api/applications, и на /api/purchases)
app.include_router(purchases.router, prefix="/api/purchases", tags=["purchases"])
app.include_router(purchases.router, prefix="/api/applications", tags=["purchases"])

@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    payload = verify_token(token)
    if not payload:
        await websocket.close(code=4003)
        return
    
    user_id = payload.get("sub")
    role = payload.get("role", "user")
    
    if not user_id:
        await websocket.close(code=4003)
        return
        
    await ws_manager.connect(websocket, user_id, role)
    try:
        while True:
            # Поддержание активного соединения и ожидание входящих сообщений
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id, role)