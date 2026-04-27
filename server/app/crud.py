from .database import get_connection
from .auth import get_password_hash
from .patterns.factory import CarFactory
from datetime import datetime

# ---------- Users ----------
def get_user_by_email(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_user_by_id(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def create_user(user_data: dict):
    hashed_pwd = get_password_hash(user_data["password"])
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, 'user')",
        (user_data["email"], hashed_pwd, user_data.get("full_name"), user_data.get("phone"))
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return get_user_by_id(user_id)

# ---------- Cars ----------
def get_cars(brand=None, min_price=None, max_price=None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM cars WHERE 1=1"
    params = []
    if brand:
        query += " AND brand LIKE ?"
        params.append(f"%{brand}%")
    if min_price is not None:
        query += " AND price >= ?"
        params.append(min_price)
    if max_price is not None:
        query += " AND price <= ?"
        params.append(max_price)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_car(car_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cars WHERE id = ?", (car_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def create_car(car_data: dict):
    car_dict = CarFactory.create_car_from_dict(car_data)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO cars (brand, model, year, price, description, image_url, body_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (car_dict["brand"], car_dict["model"], car_dict["year"],
         car_dict["price"], car_dict.get("description"), car_dict.get("image_url"),
         car_dict.get("body_type", "sedan"))
    )
    conn.commit()
    car_id = cursor.lastrowid
    conn.close()
    return get_car(car_id)

def update_car(car_id: int, car_data: dict):
    car = get_car(car_id)
    if not car:
        return None
    updates = {k: v for k, v in car_data.items() if v is not None}
    if not updates:
        return car
    updates["updated_at"] = datetime.utcnow().isoformat()
    set_clause = ", ".join(f"{key} = ?" for key in updates)
    values = list(updates.values()) + [car_id]
    conn = get_connection()
    conn.execute(f"UPDATE cars SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return get_car(car_id)

def delete_car(car_id: int):
    car = get_car(car_id)
    if not car:
        return None
    conn = get_connection()
    conn.execute("DELETE FROM cars WHERE id = ?", (car_id,))
    conn.commit()
    conn.close()
    return car

# ---------- Loan Applications ----------
def create_loan_application(user_id: int, loan_data: dict, calculation: dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO loan_applications
        (user_id, car_id, amount, term_months, interest_rate,
         monthly_payment, total_payment, overpayment, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'calculated')""",
        (user_id, loan_data["car_id"], loan_data["amount"],
         loan_data["term_months"], loan_data["interest_rate"],
         calculation["monthly_payment"], calculation["total_payment"],
         calculation["overpayment"])
    )
    conn.commit()
    app_id = cursor.lastrowid
    conn.close()
    return get_loan_application(app_id)

def get_loan_application(app_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM loan_applications WHERE id = ?", (app_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_user_loan_applications(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM loan_applications WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ---------- Test Drive Requests ----------
def create_test_drive(user_id: int, request_data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO test_drive_requests
        (user_id, car_id, preferred_date, phone, message, status)
        VALUES (?, ?, ?, ?, ?, 'pending')""",
        (user_id, request_data["car_id"], request_data["preferred_date"],
         request_data["phone"], request_data.get("message"))
    )
    conn.commit()
    req_id = cursor.lastrowid
    conn.close()
    return get_test_drive(req_id)

def get_test_drive(req_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM test_drive_requests WHERE id = ?", (req_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_user_test_drives(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM test_drive_requests WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_all_test_drives():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM test_drive_requests")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ---------- Purchases ----------
def create_purchase(user_id: int, car_id: int, price: float):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO purchases (user_id, car_id, price) VALUES (?, ?, ?)",
        (user_id, car_id, price)
    )
    conn.commit()
    purchase_id = cursor.lastrowid
    conn.close()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.purchase_date, p.price,
               c.brand, c.model, c.year
        FROM purchases p
        JOIN cars c ON p.car_id = c.id
        WHERE p.id = ?
    """, (purchase_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_user_purchases(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.purchase_date, p.price,
               c.brand, c.model, c.year
        FROM purchases p
        JOIN cars c ON p.car_id = c.id
        WHERE p.user_id = ?
        ORDER BY p.purchase_date DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ---------- Admin: User Management ----------
def get_all_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, role, full_name, phone, created_at FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_user_role(user_id: int, new_role: str):
    conn = get_connection()
    conn.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)

def delete_user(user_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM users WHERE id = ? AND role != 'admin'", (user_id,))
    conn.commit()
    affected = conn.total_changes
    conn.close()
    return affected > 0

# ---------- Admin: Statistics ----------
def get_admin_stats():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM cars")
    total_cars = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM test_drive_requests")
    total_testdrives = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM purchases")
    total_purchases = cursor.fetchone()[0]
    conn.close()
    return {
        "total_users": total_users,
        "total_cars": total_cars,
        "total_testdrives": total_testdrives,
        "total_purchases": total_purchases
    }