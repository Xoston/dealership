import sqlite3
import bcrypt

# Генерируем хеш пароля
password = "admin123"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

conn = sqlite3.connect('dealership.db')
cursor = conn.cursor()

# Удалим старого пользователя, если есть
cursor.execute("DELETE FROM users WHERE email = 'admin@luxury.com'")

# Вставим админа сразу с ролью admin
cursor.execute(
    "INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'admin', ?, ?)",
    ('admin@luxury.com', hashed, 'Администратор', '+79991234567')
)

conn.commit()
conn.close()
print("Админ создан: admin@luxury.com / admin123")