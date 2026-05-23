import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from app.database import init_db, get_connection
from app.auth import get_password_hash   # <-- теперь используется функция из приложения

# Создаём таблицы, если их нет
init_db()

password = "admin123"
hashed = get_password_hash(password)    # хешируем точно так же, как при регистрации

conn = get_connection()
cursor = conn.cursor()
cursor.execute("DELETE FROM users WHERE email = 'admin@luxury.com'")
cursor.execute(
    "INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'admin', ?, ?)",
    ('admin@luxury.com', hashed, 'Администратор', '+79991234567')
)
conn.commit()
conn.close()
print("Админ создан: admin@luxury.com / admin123")