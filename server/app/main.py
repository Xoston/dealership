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

# Настройка лимитера
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

# Инициализация приложения
app = FastAPI(title="Luxury Car Dealership API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Инициализация БД
init_db()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Сжатие ответов
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Раздача статических файлов из папки uploads и images
os.makedirs("uploads", exist_ok=True)
os.makedirs("images", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/images", StaticFiles(directory="images"), name="images")

# Инициализация наблюдателей (Observer Pattern для аудита и уведомлений)
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

# Роутер заявок и покупок (дублируем префиксы для фронтенда)
app.include_router(purchases.router, prefix="/api/purchases", tags=["purchases"])
app.include_router(purchases.router, prefix="/api/applications", tags=["purchases"])

# --- Исправленный WebSocket Endpoint ---
@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    # 1. Проверяем валидность токена
    payload = verify_token(token)
    if not payload:
        await websocket.close(code=4003)
        return
    
    user_id = payload.get("sub")
    role = payload.get("role", "user")
    
    if not user_id:
        await websocket.close(code=4003)
        return
        
    # 2. Подключаем клиента (сокет открыт)
    await ws_manager.connect(user_id=user_id, role=role, websocket=websocket)
    
    # 3. Бесконечный цикл для удержания соединения
    try:
        while True:
            # Сервер ждет сообщений от клиента, чтобы сокет не закрывался
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        # Если клиент сам отключился (закрыл вкладку, обновил страницу)
        ws_manager.disconnect(user_id)