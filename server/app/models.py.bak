from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # "admin", "manager" или "user"
    full_name = Column(String)
    phone = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    loan_applications = relationship("LoanApplication", back_populates="user")
    test_drive_requests = relationship("TestDriveRequest", back_populates="user")

class Car(Base):
    __tablename__ = "cars"
    __table_args__ = (
        CheckConstraint("price > 0", name="check_price_positive"),
    )
    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String, index=True, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(Text)
    image_url = Column(String)
    body_type = Column(String, default="sedan")
    transmission = Column(String, nullable=True)
    drive_type = Column(String, nullable=True)

    loan_applications = relationship("LoanApplication", back_populates="car")
    test_drive_requests = relationship("TestDriveRequest", back_populates="car")

class LoanApplication(Base):
    __tablename__ = "loan_applications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    car_id = Column(Integer, ForeignKey("cars.id"))
    amount = Column(Float, nullable=False)
    term_months = Column(Integer, nullable=False)
    interest_rate = Column(Float, nullable=False)
    monthly_payment = Column(Float, nullable=False)
    total_payment = Column(Float, nullable=False)
    overpayment = Column(Float, nullable=False)
    status = Column(String, default="calculated")
    created_at = Column(DateTime, server_default=func.now())

    # Поля для комментариев
    admin_comment = Column(Text, nullable=True)  # Ответ автосалона/менеджера
    user_comment = Column(Text, nullable=True)   # Примечание или отзыв самого пользователя

    user = relationship("User", back_populates="loan_applications")
    car = relationship("Car", back_populates="loan_applications")

class TestDriveRequest(Base):
    __tablename__ = "test_drive_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    car_id = Column(Integer, ForeignKey("cars.id"))
    preferred_date = Column(DateTime)
    phone = Column(String, nullable=False)
    message = Column(Text)
    status = Column(String, default="pending")
    created_at = Column(DateTime, server_default=func.now())
    admin_comment = Column(Text, nullable=True)  # Ответ менеджера по тест-драйву

    user = relationship("User", back_populates="test_drive_requests")
    car = relationship("Car", back_populates="test_drive_requests")