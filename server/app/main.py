import os

from fastapi import FastAPI, Request, WebSocket, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .database import init_db
from .routes import cars, auth, loans, testdrives, purchases, admin, chat
from .audit import event_manager, FileLoggerObserver, NotificationObserver
from .auth import verify_token
from .ws_manager import ws_manager
from starlette.websockets import WebSocketDisconnect
from contextlib import asynccontextmanager

limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
        print("--- База данных успешно инициализирована ---")
    except Exception as db_exc:
        print(f"--- КРИТИЧЕСКАЯ ОШИБКА ИНИЦИАЛИЗАЦИИ БД: {db_exc} ---")
        print("Приложение запущено, но база данных может быть недоступна.")
    yield

app = FastAPI(title="Luxury Car Dealership API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter

ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

def _apply_full_cors_headers(response, origin: str):
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    response = _rate_limit_exceeded_handler(request, exc)
    origin = request.headers.get("origin")
    if origin in ALLOWED_ORIGINS:
        _apply_full_cors_headers(response, origin)
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    status_code = exc.status_code if isinstance(exc, HTTPException) else 500
    detail = exc.detail if isinstance(exc, HTTPException) else str(exc)
    response = JSONResponse(status_code=status_code, content={"detail": detail})
    origin = request.headers.get("origin")
    if origin in ALLOWED_ORIGINS:
        _apply_full_cors_headers(response, origin)
    return response

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
os.makedirs("images", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/images", StaticFiles(directory="images"), name="images")

file_logger = FileLoggerObserver("audit.log")
notification_logger = NotificationObserver()
event_manager.subscribe(file_logger)
event_manager.subscribe(notification_logger)

app.include_router(cars.router, prefix="/api/cars", tags=["cars"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(loans.router, prefix="/api/loans", tags=["loans"])
app.include_router(testdrives.router, prefix="/api/testdrives", tags=["testdrives"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
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
    await ws_manager.connect(user_id=user_id, role=role, websocket=websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id)