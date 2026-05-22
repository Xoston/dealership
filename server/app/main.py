from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import init_db
from .routes import cars, auth, loans, testdrives, purchases, admin, chat
from .audit import event_manager, FileLoggerObserver
import os

app = FastAPI(title="Luxury Car Dealership API", version="1.0.0")

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

file_logger = FileLoggerObserver("audit.log")
event_manager.subscribe(file_logger)

app.include_router(cars.router, prefix="/api/cars", tags=["cars"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(loans.router, prefix="/api/loans", tags=["loans"])
app.include_router(testdrives.router, prefix="/api/testdrives", tags=["testdrives"])
app.include_router(purchases.router, prefix="/api/purchases", tags=["purchases"])
app.include_router(admin.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"message": "Dealership API is running"}