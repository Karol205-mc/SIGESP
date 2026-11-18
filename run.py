import sys
import os
import subprocess
import webbrowser
import time
from pathlib import Path

# Directorio raíz del proyecto
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "Backend_PYTHON"
FRONTEND_DIR = ROOT_DIR / "Frontend_JAVASCRIPT"
STATIC_INDEX = BACKEND_DIR / "app" / "static" / "index.html"

print("=" * 76)
print("  SIGESP - SISTEMA INTEGRAL DE GESTIÓN POLICIAL (GRUPO 3)")
print("  Norma Técnica: IEEE 830-1998 | Puerto Asignado: :8083")
print("  Base de Datos: PostgreSQL 18 en la Nube (Aiven Cloud)")
print("=" * 76)

# 1. Verificar si el Frontend está compilado
if not STATIC_INDEX.exists():
    print("\n[INFO] Compilando Frontend SPA por primera vez...")
    try:
        subprocess.run(["npm", "run", "build"], cwd=str(FRONTEND_DIR), check=True, shell=True)
        print("[OK] Frontend compilado exitosamente.")
    except Exception as e:
        print(f"[ADVERTENCIA] No se pudo compilar con npm ({e}). Continuando con backend...")

# 2. Abrir navegador automáticamente
def abrir_navegador():
    time.sleep(1.5)
    url = "http://localhost:8083"
    print(f"\n[INFO] Abriendo navegador en: {url}")
    webbrowser.open(url)

import threading
threading.Thread(target=abrir_navegador, daemon=True).start()

# 3. Iniciar el servidor FastAPI (que sirve la API y el Frontend SPA)
sys.path.insert(0, str(BACKEND_DIR))
import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8083,
        reload=False
    )
