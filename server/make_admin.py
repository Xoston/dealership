import sqlite3
conn = sqlite3.connect('dealership.db')
conn.execute("UPDATE users SET role = 'admin' WHERE email = 'admin@luxury.com'")
conn.commit()
conn.close()
print("Готово: admin@luxury.com теперь админ.")