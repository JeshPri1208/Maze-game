@echo off
cd /d "%~dp0"
echo Starting local server for Maze Game demo...
echo.
echo If Python is installed, the game will open in your browser.
echo Otherwise, please manually open index.html in your browser.
echo.
python -m http.server 8000 >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found. Trying alternative methods...
    echo.
    echo Please open the following file in your browser:
    echo file:///%~dp0index.html
    echo.
    echo Or install Python from https://www.python.org/downloads/
    echo and run: python -m http.server 8000
    pause
) else (
    start http://localhost:8000
    echo Server started! Opening browser...
    timeout /t 2 >nul
)