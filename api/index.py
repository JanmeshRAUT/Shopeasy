import sys
import traceback
try:
	from app import app, ensure_database
	ensure_database()
except Exception as e:
	print("[Vercel Startup Error]", file=sys.stderr)
	print(str(e), file=sys.stderr)
	traceback.print_exc(file=sys.stderr)
	app = None

# Vercel Python runtime expects a module-level `app` object.
