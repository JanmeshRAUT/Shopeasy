
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import sqlite3
import os
import random
import secrets
import datetime
import hashlib

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
    with open(path, "r", encoding="utf-8-sig") as f:
        values = [line.strip() for line in f.readlines() if line.strip()]
    return values if values else fallback_values


def generate_flag(tag):
    return f"FLAG{{{tag}_{secrets.token_hex(5).upper()}}}"


CTF_FLAGS = {

    "BRUTE": generate_flag("BRUTE"),
    "ADMIN_DELETE": generate_flag("COOKIE"),
    "LEAKED_PROFILE": generate_flag("SQLI"),
}

CTF_FLAG_TO_VULN = {
    CTF_FLAGS["BRUTE"]: "Brute Force Login",
    CTF_FLAGS["ADMIN_DELETE"]: "Cookie Authorization Bypass / Admin Actions",
    CTF_FLAGS["LEAKED_PROFILE"]: "SQL Injection Data Breach",
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

# ─── DETERMINISTIC TARGET SELECTION (For Vercel/Serverless Stability) ───
# Ensures all concurrent users/instances see the same targets for a given day.
def get_daily_target(wordlist, salt="default"):
    if not wordlist:
        return "fallback_user"
    # Seed with current date + salt to keep it stable but rotating
    seed_str = f"{datetime.date.today().isoformat()}_{salt}"
    seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    rng = random.Random(seed)
    return rng.choice(wordlist)

# SQL Injection Targets (discovered via UNION)
VULNERABLE_TARGET_USERS = {
    "leaked_tester": "p@ss_leaked_99",
    "audit_manager": "secure_audit_2026",
    "staged_dev": "temp_dev_access"
}

# 1. Load initial lists
_raw_usernames = load_wordlist("usernames.txt", fallback_usernames)
_raw_passwords = load_wordlist("passwords.txt", fallback_passwords)

# 2. Filter out SQLi target
_usernames_no_sqli = [u for u in _raw_usernames if u not in VULNERABLE_TARGET_USERS]

# 3. Exclude existing database users
def get_lab_usernames():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users")
        existing_users = {row[0] for row in cursor.fetchall()}
        cursor.execute("SELECT username FROM staff_accounts")
        existing_staff = {row[0] for row in cursor.fetchall()}
        conn.close()
        collision_set = existing_users.union(existing_staff)
        return [u for u in _usernames_no_sqli if u not in collision_set]
    except:
        return [u for u in _usernames_no_sqli if u not in main_db_users]

LAB_USERNAME_WORDLIST = get_lab_usernames()
LAB_PASSWORD_WORDLIST = _raw_passwords

if not LAB_USERNAME_WORDLIST:
    LAB_USERNAME_WORDLIST = ["lab_tester_99"]

# 4. Select the stable target for today
LAB_ACTIVE_CREDENTIAL = (
    get_daily_target(LAB_USERNAME_WORDLIST, "user"),
    get_daily_target(LAB_PASSWORD_WORDLIST, "pass"),
)

print(f"[*] Daily Lab Target (Stable across instances): {LAB_ACTIVE_CREDENTIAL[0]}")

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

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS staff_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
        """
    )
    conn.commit() # Ensure schema is saved before checking counts

    users = [
        ("admin", "admin_shopeasy_secure_#2026"),
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
        ("leaked_tester", "p@ss_leaked_99"),
        ("audit_manager", "secure_audit_2026"),
        ("staged_dev", "temp_dev_access"),
    ]
    cursor.execute("SELECT COUNT(*) AS c FROM users")
    user_count = cursor.fetchone()[0]
    if user_count == 0:
        cursor.executemany(
            "INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)", users
        )

    staff = [
        ("leaked_tester", "p@ss_leaked_99", "Tester"),
        ("audit_manager", "secure_audit_2026", "Manager"),
        ("staged_dev", "temp_dev_access", "Developer"),
    ]
    cursor.execute("SELECT COUNT(*) AS c FROM staff_accounts")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            "INSERT OR IGNORE INTO staff_accounts (username, password, role) VALUES (?, ?, ?)", staff
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
    data = request.get_json()
    username = data.get("username", "")
    password = data.get("password", "")

    # ─── USER-SPECIFIC TARGET SELECTION ───
    # Generates a different target for different students based on their IP
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
    
    def get_session_target(wordlist, salt):
        seed_str = f"{client_ip}_{salt}_{datetime.date.today().isoformat()}"
        seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
        rng = random.Random(seed)
        return rng.choice(wordlist)

    # Calculate this student's specific target
    session_username = get_session_target(LAB_USERNAME_WORDLIST, "user")
    session_password = get_session_target(LAB_PASSWORD_WORDLIST, "pass")

    # Special flag for logging in as a user discovered via SQL Injection
    if username in VULNERABLE_TARGET_USERS and password == VULNERABLE_TARGET_USERS[username]:
        response = make_response(jsonify({
            "success": True,
            "message": "Login successful",
            "username": username,
            "ctf_flag": CTF_FLAGS["LEAKED_PROFILE"],
            "flag_hint": "Discovery of Leaked Credentials via SQLi"
        }))
        response.set_cookie("role", "user", httponly=False)
        response.set_cookie("username", username, httponly=False)
        return response

    # Check against this student's specific Brute Force target
    if username == session_username:
        if password == session_password:
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
        
        # VULNERABILITY: User exists (Specific for this student's IP)
        return jsonify({
            "success": False, 
            "message": "Incorrect Password",
            "debug_info": "User account is valid, check credentials"
        }), 401

    conn = get_db()
    cursor = conn.cursor()

    # Database check
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        # Generic error for all other users (even if they are in the wordlist)
        return jsonify({"success": False, "message": "Incorrect Username and Password"}), 401

    if user["username"] == "admin":
        return jsonify({"success": False, "message": "Incorrect Username and Password"}), 401

    if user["password"] != password:
        # VULNERABILITY: Existing database users also reveal existence
        return jsonify({
            "success": False, 
            "message": "Incorrect Password",
            "debug_info": "User account is valid, check credentials"
        }), 401

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

    query = "SELECT name, price FROM products WHERE name LIKE '%" + search + "%'"

    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        results = [dict(row) for row in rows]
        conn.close()
        response = {"success": True, "results": results, "query": query}
        # If SQLi detected, replace results with only the leaked user
        is_sqli = "union" in search.lower() and ("users" in search.lower() or "staff_accounts" in search.lower())
        if is_sqli:
            response["ctf_flag"] = CTF_FLAGS["SQLI"]
            response["flag_hint"] = "SQL Injection (Discovery)"
            
            # Real leak: fetch from the SENSITIVE staff_accounts table
            # Students must now discover this table name or use it in their UNION
            conn_leak = get_db()
            cursor_leak = conn_leak.cursor()
            cursor_leak.execute("SELECT username, password FROM staff_accounts")
            all_staff = cursor_leak.fetchall()
            conn_leak.close()
            
            # Format results
            response["results"] = [
                {"name": f"Staff: {u['username']} (Pass: {u['password']})", "price": 0} 
                for u in all_staff
            ]
        return jsonify(response)
    except Exception as e:
        try:
            conn.close()
        except:
            pass
        # Return more detailed error for debugging lab challenges
        return jsonify({
            "success": False, 
            "error": f"Database Error: {str(e)}", 
            "query": query,
            "help": "Ensure your UNION select has exactly 2 columns to match 'name' and 'price'"
        }), 400

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
        all_users_list = [dict(row) for row in cursor.fetchall()]
        
        # Filter out the SQLi challenge target users to keep challenges separate
        users = [u for u in all_users_list if u["username"] not in VULNERABLE_TARGET_USERS]
        
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

@app.route("/api/user/flag", methods=["GET"])
def get_user_profile_flag():
    username = request.cookies.get("username")
    
    # Use the same IP-based logic to find this student's specific target
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
    seed_str = f"{client_ip}_user_{datetime.date.today().isoformat()}"
    seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    rng = random.Random(seed)
    session_username = rng.choice(LAB_USERNAME_WORDLIST)

    if username in VULNERABLE_TARGET_USERS:
        return jsonify({
            "success": True, 
            "ctf_flag": CTF_FLAGS["LEAKED_PROFILE"],
            "flag_type": "SQL Injection Data Breach"
        })
    
    if username == session_username:
        return jsonify({
            "success": True, 
            "ctf_flag": CTF_FLAGS["BRUTE"],
            "flag_type": "Brute Force Success"
        })

    return jsonify({"success": False, "message": "No flag available for this user."}), 403

if __name__ == "__main__":
    app.run(debug=True, port=5000)
