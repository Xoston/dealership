from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routes import cars, auth, loans, testdrives, purchases, admin
from .audit import event_manager, FileLoggerObserver

app = FastAPI(title="Luxury Car Dealership API", version="1.0.0")

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

file_logger = FileLoggerObserver("audit.log")
event_manager.subscribe(file_logger)

app.include_router(cars.router, prefix="/api/cars", tags=["cars"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(loans.router, prefix="/api/loans", tags=["loans"])
app.include_router(testdrives.router, prefix="/api/testdrives", tags=["testdrives"])
app.include_router(purchases.router, prefix="/api/purchases", tags=["purchases"])
app.include_router(admin.router)  # уже с префиксом /api/admin внутри

@app.get("/")
def root():
    return {"message": "Dealership API is running"}