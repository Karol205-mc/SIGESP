@echo off
title SIGESP - Sistema Integral de Gestion Policial
color 0B

echo ==============================================================================
echo       SIGESP - SISTEMA INTEGRAL DE GESTION POLICIAL (GRUPO 3)
echo       Norma Tecnica: IEEE 830-1998  ^|  Puerto: :8083
echo       Base de Datos: PostgreSQL 18 en la Nube (Aiven Cloud)
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/2] Verificando compilacion de Frontend y Assets...
if not exist "Backend_PYTHON\app\static\index.html" (
    echo Compilando Frontend SPA...
    cd Frontend_JAVASCRIPT
    call npm run build
    cd ..
)

echo.
echo [2/2] Iniciando Servidor Monolitico Unificado (Backend + Frontend en :8083)...
start http://localhost:8083

cd Backend_PYTHON
python main.py

pause
