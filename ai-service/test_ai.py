import os
import sys

# Add the current directory to sys.path so 'app' can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.main import app
    from app.providers import get_provider
    from app.services.ai_service import analyze_resume
    
    p = get_provider()
    print("PROVIDER:", type(p).__name__)
    print("APP_OK")
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
