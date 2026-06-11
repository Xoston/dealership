import sqlite3
conn = sqlite3.connect('dealership.db')
print('SQLite version:', sqlite3.sqlite_version)
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print('Tables:', [t[0] for t in tables])
conn.close()