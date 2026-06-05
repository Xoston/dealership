@echo off
chcp 65001 > nul
echo ===================================================
echo Запуск Luxury Dealer (Backend: uvicorn) + Ollama
echo ===================================================

:: 1. Проверка/Запуск Ollama
echo [1/3] Проверка Ollama...
:: Пытаемся запустить ollama serve в фоне, если ещё не работает
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I "ollama.exe" >NUL
if "%ERRORLEVEL%"=="1" (
    echo Запускаем Ollama...
    start "Ollama" /MIN ollama serve
    echo Ждём 5 секунд, чтобы Ollama загрузилась...
    timeout /t 5 >nul
) else (
    echo Служба Ollama уже активна.
)

:: 2. Запуск бэкенда FastAPI (глобальный python)
echo [2/3] Запуск бэкенда FastAPI...
start "FastAPI Backend" cmd /k "cd server && python -m uvicorn app.main:app --port 8000 --reload"

:: 3. Запуск фронтенда React
echo [3/3] Запуск фронтенда React...
start "React Frontend" cmd /k "cd client && npm start"

echo ===================================================
echo Все процессы запущены!
echo ===================================================
pause