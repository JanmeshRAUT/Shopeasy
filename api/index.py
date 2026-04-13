import sys
try:
	from app import app, ensure_database
	ensure_database()
except Exception as e:
	print(f"[Vercel Startup Error] {e}", file=sys.stderr)
	raise

# Vercel Python runtime expects a module-level `app` object.
