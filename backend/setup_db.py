import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "shopeasy.db")

def setup_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create users table (passwords stored in plain text - intentionally insecure)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    """)

    # Create products table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL
        )
    """)

    # Create deleted users table for admin undo flow
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS deleted_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Seed users (plain text passwords - intentionally insecure)
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
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)", users
    )

    # Seed products - 50+ items
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
    cursor.executemany(
        "INSERT OR IGNORE INTO products (name, price) VALUES (?, ?)", products
    )

    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")
    print(f"📦 Created tables: users, products")
    print(f"👤 Seeded {len(users)} users with plain-text passwords")
    print(f"🛒 Seeded {len(products)} products")

if __name__ == "__main__":
    setup_database()
