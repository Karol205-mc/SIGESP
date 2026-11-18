import uvicorn
import os
import sys
from pathlib import Path

# Agregar directorio actual al sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.main import app
from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
