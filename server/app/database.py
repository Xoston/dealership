import sqlite3
import os

DB_PATH = "dealership.db"

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# Add this line to satisfy the import in crud.py
get_connection = get_db 

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # --- Создание основных таблиц ---
    
    # Таблица users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        role TEXT DEFAULT 'user'
    )
    """)

    # Таблица cars
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER,
        price INTEGER,
        body_type TEXT,
        engine_volume REAL,
        power INTEGER,
        transmission TEXT,
        drive_type TEXT,
        acceleration REAL,
        max_speed INTEGER,
        image_url TEXT
    )
    """)

    # ОБНОВЛЕННАЯ: Таблица тест-драйвов с полями rating и review_text
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS test_drive_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        car_id INTEGER NOT NULL,
        preferred_date TIMESTAMP,
        phone TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        rating INTEGER,
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (car_id) REFERENCES cars(id)
    )
    """)

    # Таблица loan_applications
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS loan_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        car_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        term_months INTEGER NOT NULL,
        interest_rate REAL,
        monthly_payment REAL,
        status TEXT DEFAULT 'pending',
        admin_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (car_id) REFERENCES cars(id)
    )
    """)

    # --- БЛОК АВТОМАТИЧЕСКИХ МИГРАЦИЙ ---
    
    try:
        cursor.execute("ALTER TABLE test_drive_requests ADD COLUMN admin_comment TEXT")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE loan_applications ADD COLUMN admin_comment TEXT")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE test_drive_requests ADD COLUMN rating INTEGER")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE test_drive_requests ADD COLUMN review_text TEXT")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()