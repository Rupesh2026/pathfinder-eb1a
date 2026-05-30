$root = $PSScriptRoot

Write-Host "Starting EB-1A Agent System..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root\frontend'; npm run dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root\agents'; .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

Write-Host "Frontend -> http://localhost:2028" -ForegroundColor Green
Write-Host "Backend  -> http://localhost:8000" -ForegroundColor Green
