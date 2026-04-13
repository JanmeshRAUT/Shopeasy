
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import sqlite3
import os
import random
import secrets

app = Flask(__name__)
CORS(app, supports_credentials=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Always use /tmp/shopeasy.db on Vercel for compatibility
if os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or os.path.exists("/tmp"):
    DB_PATH = os.path.join("/tmp", "shopeasy.db")
else:
    DB_PATH = os.path.join(BASE_DIR, "shopeasy.db")
WORDLIST_DIR = os.path.join(BASE_DIR, "data", "wordlists")


def load_wordlist(filename, fallback_values):
    path = os.path.join(WORDLIST_DIR, filename)
    if not os.path.exists(path):
        return fallback_values
    with open(path, "r", encoding="utf-8") as f:
        values = [line.strip() for line in f.readlines() if line.strip()]
    return values if values else fallback_values


def generate_flag(tag):
    return f"FLAG{{{tag}_{secrets.token_hex(5).upper()}}}"


CTF_FLAGS = {
    "SQLI": generate_flag("SQLI"),
    "BRUTE": generate_flag("BRUTE"),
    "COOKIE": generate_flag("COOKIE"),
    "ADMIN_DELETE": generate_flag("ADMIN_DELETE"),
    "LEAKED_LOGIN": generate_flag("LEAKED_LOGIN"),
}

CTF_FLAG_TO_VULN = {
    CTF_FLAGS["SQLI"]: "SQL Injection",
    CTF_FLAGS["BRUTE"]: "Brute Force Login",
    CTF_FLAGS["COOKIE"]: "Cookie Authorization Bypass",
    CTF_FLAGS["ADMIN_DELETE"]: "Insecure Admin Delete Action",
    CTF_FLAGS["LEAKED_LOGIN"]: "Leaked User Login",
}

fallback_usernames = [
    "operator",
    "support",
    "tester",
    "warehouse",
    "coordinator",
]
fallback_passwords = [
    "letmein",
    "password123",
    "welcome",
    "secret",
    "changeme",
]

main_db_users = {"admin", "alice", "bob", "charlie", "diana"}
LAB_USERNAME_WORDLIST = [
    u for u in load_wordlist("usernames.txt", fallback_usernames) if u not in main_db_users
]
LAB_PASSWORD_WORDLIST = load_wordlist("passwords.txt", fallback_passwords)

if not LAB_USERNAME_WORDLIST:
    LAB_USERNAME_WORDLIST = fallback_usernames
if not LAB_PASSWORD_WORDLIST:
    LAB_PASSWORD_WORDLIST = fallback_passwords

LAB_ACTIVE_CREDENTIAL = (
    random.choice(LAB_USERNAME_WORDLIST),
    random.choice(LAB_PASSWORD_WORDLIST),
)
# Stores random delete targets per actor (logged-in username or guest).
ADMIN_DELETE_TARGETS = {}


def get_admin_challenge_target(current_username=None):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username != 'admin'")
    candidate_users = [row["username"] for row in cursor.fetchall()]
    conn.close()

    actor_key = current_username or "guest"
    deletable = [u for u in candidate_users if not current_username or u != current_username]

    if not deletable:
        return None

    saved_target = ADMIN_DELETE_TARGETS.get(actor_key)
    if saved_target in deletable:
        return saved_target

    chosen = random.choice(deletable)
    ADMIN_DELETE_TARGETS[actor_key] = chosen
    return chosen


def ensure_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            price REAL NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS deleted_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    users = [
        ("admin", "admin123"),
        ("alice", "password1"),
        ("bob", "letmein"),
        ("charlie", "qwerty"),
        ("diana", "123456"),
        ("ethan", "demo123"),
        ("fiona", "fiona123"),
        ("george", "secure99"),
        ("hannah", "hannah321"),
        ("ian", "ianpass"),
        ("julia", "julia123"),
        ("kevin", "kevin777"),
        ("luna", "moonlight"),
        ("mason", "mason456"),
        ("nina", "ninaabc"),
        ("leaked_user", "leakedpass"),
    ]
    cursor.execute("SELECT COUNT(*) AS c FROM users")
    user_count = cursor.fetchone()[0]
    if user_count == 0:
        cursor.executemany(
            "INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)", users
        )

    products = [
        ("Wireless Headphones", 49.99),
        ("Bluetooth Speaker", 29.99),
        ("USB-C Hub", 19.99),
        ("Mechanical Keyboard", 89.99),
        ("Gaming Mouse", 39.99),
        ("Webcam HD 1080p", 59.99),
        ("Laptop Stand", 24.99),
        ("Monitor Light Bar", 34.99),
        ("Portable Charger", 44.99),
        ("Smart Watch", 129.99),
        ("Wireless Mouse", 35.99),
        ("USB-C Cable 2m", 12.99),
        ("Monitor Mount Arm", 79.99),
        ("HDMI Cable 4K", 14.99),
        ("Desk Lamp LED", 42.99),
        ("Phone Stand", 16.99),
        ("Keyboard Wrist Rest", 22.99),
        ("Laptop Cooling Pad", 54.99),
        ("External SSD 1TB", 119.99),
        ("Wireless Charger", 28.99),
        ("USB Hub 7-Port", 32.99),
        ("Microphone USB", 67.89),
        ("Headphone Stand", 18.99),
        ("Cable Organizer", 11.99),
        ("Screen Protector", 9.99),
        ("Mouse Pad XL", 27.99),
        ("Desk Organizer", 38.99),
        ("Monitor Stand Riser", 45.99),
        ("Laptop Sleeve 15in", 31.99),
        ("Power Bank 20000mAh", 55.99),
        ("Bluetooth Earbuds", 79.99),
        ("Wireless Keyboard", 64.99),
        ("USB-A to USB-C Adapter", 8.99),
        ("HDMI Splitter", 24.99),
        ("DisplayPort Cable", 21.99),
        ("Mechanical Switches", 19.99),
        ("Desk Pad Mat", 35.99),
        ("Monitor Light Filter", 33.99),
        ("Laptop Stand Aluminum", 62.99),
        ("USB Thumb Drive 64GB", 18.99),
        ("Wireless Mic System", 149.99),
        ("Docking Station", 89.99),
        ("Fiber Optic Cable", 29.99),
        ("Screen Privacy Filter", 39.99),
        ("Desk Clamp Mount", 36.99),
        ("Keyboard Switches Pack", 28.99),
        ("Monitor Arm Mount", 52.99),
        ("USB Flash Drive", 15.99),
        ("RGB LED Strip", 24.99),
        ("Laptop Fan Cooler", 42.99),
    ]
    cursor.execute("SELECT COUNT(*) AS c FROM products")
    product_count = cursor.fetchone()[0]
    if product_count == 0:
        cursor.executemany(
            "INSERT OR IGNORE INTO products (name, price) VALUES (?, ?)", products
        )

    conn.commit()
    conn.close()

def get_db():
    ensure_database()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# -------------------------------------------------------
# VULNERABILITY #1 & #2: Login - No rate limiting, no lockout
# Returns specific error messages to aid brute force
# -------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def login():
        # Special flag for logging in as leaked_user
        if username == "leaked_user" and password == "leakedpass":
            response = make_response(jsonify({
                "success": True,
                "message": "Login successful",
                "username": username,
                "ctf_flag": CTF_FLAGS["LEAKED_LOGIN"],
                "flag_hint": "Leaked User Login"
            }))
            response.set_cookie("role", "user", httponly=False)
            response.set_cookie("username", username, httponly=False)
            return response
    data = request.get_json()
    username = data.get("username", "")
    password = data.get("password", "")

    active_username, active_password = LAB_ACTIVE_CREDENTIAL

    # Separate brute-force lab path: exactly one active credential pair is valid.
    # This account is intentionally not stored in the main SQLite users table.
    if username in LAB_USERNAME_WORDLIST:
        if username == active_username and password == active_password:
            response = make_response(jsonify({
                "success": True,
                "message": "Login successful",
                "username": username,
                "ctf_flag": CTF_FLAGS["BRUTE"],
                "flag_hint": "Brute Force Login"
            }))
            response.set_cookie("role", "user", httponly=False)
            response.set_cookie("username", username, httponly=False)
            return response
        return jsonify({"success": False, "message": "Invalid password"}), 401

    conn = get_db()
    cursor = conn.cursor()

    # Using parameterized query only for login (to keep it working),
    # but NO rate limiting, NO lockout, NO CAPTCHA
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"success": False, "message": "User not found"}), 401

    # Lab design rule: keep brute-force (login) and admin access challenges separate.
    # Admin must not be reachable via login guessing; use cookie manipulation path instead.
    if user["username"] == "admin":
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    if user["password"] != password:
        # VULNERABILITY: Reveals specific error - helps brute force
        return jsonify({"success": False, "message": "Invalid password"}), 401

    response = make_response(jsonify({
        "success": True,
        "message": "Login successful",
        "username": user["username"]
    }))

    # VULNERABILITY #3: Cookie set with role - blindly trusted
    response.set_cookie("role", "user", httponly=False)        # httponly=False so JS can read it
    response.set_cookie("username", user["username"], httponly=False)
    return response

@app.route("/api/logout", methods=["POST"])
def logout():
    response = make_response(jsonify({"success": True}))
    response.delete_cookie("role")
    response.delete_cookie("username")
    return response

# -------------------------------------------------------
# VULNERABILITY #1: SQL Injection in Search
# Raw string concatenation - no sanitization
# -------------------------------------------------------
@app.route("/api/products/search", methods=["GET"])
def search_products():
    search = request.args.get("q", "")
    conn = get_db()
    cursor = conn.cursor()

    # VULNERABLE: Direct string concatenation - allows UNION-based injection
    # Try: ' UNION SELECT username, password FROM users--
    # Only leak the special 'leaked_user' for CTF
    query = "SELECT name, price FROM products WHERE name LIKE '%" + search + "%'"

    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        results = [dict(row) for row in rows]
        conn.close()
        response = {"success": True, "results": results, "query": query}
        # If SQLi detected, replace results with only the leaked user
        if "union" in search.lower() and "users" in search.lower():
            response["ctf_flag"] = CTF_FLAGS["SQLI"]
            response["flag_hint"] = "SQL Injection"
            response["results"] = [{"name": "leaked_user", "price": "leakedpass"}]
        return jsonify(response)
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "error": str(e), "query": query}), 400

@app.route("/api/products", methods=["GET"])
def get_products():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()
    products = [dict(row) for row in rows]
    conn.close()
    return jsonify({"success": True, "products": products})

# -------------------------------------------------------
# VULNERABILITY #3 & #4: Admin Dashboard
# Trusts cookie blindly - no server-side session validation
# Hidden route not linked in UI
# -------------------------------------------------------
@app.route("/api/admin", methods=["GET"])
def admin_dashboard():
    # VULNERABILITY: Blindly trusts the cookie value
    role = request.cookies.get("role")
    if role == "admin":
        current_username = request.cookies.get("username")
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, password FROM users")
        users = [dict(row) for row in cursor.fetchall()]
        cursor.execute("SELECT * FROM products")
        products = [dict(row) for row in cursor.fetchall()]
        conn.close()

        challenge_target = get_admin_challenge_target(current_username)
        hint = (
            f"Delete user '{challenge_target}' from Users tab to retrieve the admin action flag."
            if challenge_target
            else "No eligible user available for the delete challenge."
        )

        return jsonify({
            "success": True,
            "message": "Welcome, Admin!",
            "users": users,
            "products": products,
            "flag_hint": hint,
            "challenge_target": challenge_target,
        })
    else:
        return jsonify({"success": False, "message": "Access denied. Admins only."}), 403


@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
def admin_delete_user(user_id):
    role = request.cookies.get("role")
    if role != "admin":
        return jsonify({"success": False, "message": "Access denied. Admins only."}), 403

    current_username = request.cookies.get("username")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, password FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"success": False, "message": "User not found."}), 404

    if user["username"] == "admin":
        conn.close()
        return jsonify({"success": False, "message": "Cannot delete root admin account."}), 400

    if current_username and user["username"] == current_username:
        conn.close()
        return jsonify({"success": False, "message": "Cannot delete your currently logged-in account."}), 400

    challenge_target = get_admin_challenge_target(current_username)

    # Mock delete mode: do not mutate persistent database records.
    # The frontend removes the row from current UI state only.

    response = {
        "success": True,
        "message": f"Mock delete applied for '{user['username']}'. Refresh to restore.",
        "deleted_user": user["username"],
        "mock": True,
    }

    if challenge_target and user["username"] == challenge_target:
        response["ctf_flag"] = CTF_FLAGS["ADMIN_DELETE"]
        response["flag_hint"] = "Insecure Admin Delete Action"
    else:
        response["next_hint"] = (
            f"Challenge not solved yet. Delete '{challenge_target}' to retrieve the flag."
            if challenge_target
            else "Challenge unavailable because no eligible target exists."
        )

    conn.close()
    return jsonify(response)


@app.route("/api/admin/users/restore", methods=["POST"])
def admin_restore_user():
    role = request.cookies.get("role")
    if role != "admin":
        return jsonify({"success": False, "message": "Access denied. Admins only."}), 403

    return jsonify({
        "success": True,
        "message": "Mock mode active. No persistent deletion occurred.",
        "user": None,
    })


@app.route("/api/ctf/validate", methods=["POST"])
def validate_flag():
    data = request.get_json() or {}
    submitted = (data.get("flag") or "").strip()
    vuln = CTF_FLAG_TO_VULN.get(submitted)
    if vuln:
        return jsonify({"valid": True, "vulnerability": vuln})
    return jsonify({"valid": False, "vulnerability": None}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5000)
