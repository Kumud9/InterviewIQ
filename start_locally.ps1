# InterviewIQ AI Platform Launcher

Write-Host "==================================================" -ForegroundColor Green
Write-Host "       Starting InterviewIQ AI Platform           " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# 1. Start backend FastAPI
Write-Host "`n[1/3] Setting up Python Backend..." -ForegroundColor Cyan
if (-not (Test-Path "backend\venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv backend\venv
}

Write-Host "Installing python dependencies..." -ForegroundColor Yellow
& backend\venv\Scripts\pip install -r backend\requirements.txt

Write-Host "Starting FastAPI Backend server asynchronously..." -ForegroundColor Yellow
Start-Process -FilePath "backend\venv\Scripts\python" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -WorkingDirectory "backend"

# 2. Start frontend Next.js
Write-Host "`n[2/3] Starting Next.js Frontend..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory "frontend"

# 3. Complete
Write-Host "`n[3/3] Platform Launch Triggered!" -ForegroundColor Green
Write-Host "--------------------------------------------------" -ForegroundColor Green
Write-Host "Frontend URL: http://localhost:3001" -ForegroundColor White
Write-Host "Backend API docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "--------------------------------------------------" -ForegroundColor Green
Write-Host "Press any key to close this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
