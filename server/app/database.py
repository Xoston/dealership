import sqlite3
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "dealership.db")

def get_connection():
    # Добавлен таймаут ожидания освобождения БД (30 сек) и отключена проверка потока для многопоточности FastAPI
    conn = sqlite3.connect(DATABASE_URL, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Создание таблиц, если их нет
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        full_name TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        price REAL NOT NULL CHECK (price > 0),
        description TEXT,
        image_url TEXT,
        body_type TEXT DEFAULT 'sedan',
        restyling BOOLEAN DEFAULT FALSE,
        engine_volume REAL,
        power INTEGER,
        fuel_type TEXT,
        consumption REAL,
        drive_type TEXT,
        transmission TEXT,
        acceleration REAL,
        max_speed INTEGER,
        clearance INTEGER,
        seats INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS car_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        car_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS loan_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        car_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        term_months INTEGER NOT NULL,
        interest_rate REAL NOT NULL,
        monthly_payment REAL NOT NULL,
        total_payment REAL NOT NULL,
        overpayment REAL NOT NULL,
        status TEXT DEFAULT 'calculated',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (car_id) REFERENCES cars(id)
    );
    CREATE TABLE IF NOT EXISTS test_drive_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        car_id INTEGER NOT NULL,
        preferred_date TIMESTAMP,
        phone TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (car_id) REFERENCES cars(id)
    );
    CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        car_id INTEGER NOT NULL,
        price REAL NOT NULL,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (car_id) REFERENCES cars(id)
    );
    """)

    # Миграция для таблицы cars: добавляем новые столбцы, если их нет
    new_columns = [
        "engine_volume REAL",
        "power INTEGER",
        "fuel_type TEXT",
        "consumption REAL",
        "drive_type TEXT",
        "transmission TEXT",
        "acceleration REAL",
        "max_speed INTEGER",
        "clearance INTEGER",
        "seats INTEGER"
    ]
    for col_def in new_columns:
        col_name = col_def.split()[0]
        col_type = col_def.split()[-1]
        try:
            cursor.execute(f"ALTER TABLE cars ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass  # колонка уже существует

    # Автоматическая миграция: добавляем admin_comment в test_drive_requests, если его нет
    try:
        cursor.execute("ALTER TABLE test_drive_requests ADD COLUMN admin_comment TEXT")
    except sqlite3.OperationalError:
        pass

    # Автоматическая миграция: добавляем admin_comment в loan_applications, если его нет
    try:
        cursor.execute("ALTER TABLE loan_applications ADD COLUMN admin_comment TEXT")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()