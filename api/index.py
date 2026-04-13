import sys
import traceback
from app import app, ensure_database
try:
    ensure_database()
except Exception as e:
    print("[Vercel Startup Error]", file=sys.stderr)
    print(str(e), file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
# Vercel Python runtime expects a module-level `app` object.
