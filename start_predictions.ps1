#!/usr/bin/env pwsh
# Startup script for DMC Hackathon application

Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DMC Hackathon Dashboard - Predictions Page Setup" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if backend is already running
Write-Host "Checking services..." -ForegroundColor Yellow

$backendStatus = try { 
    $null = curl -s "http://localhost:8000/health" 2>/dev/null
    $LASTEXITCODE -eq 0
} catch { 
    $false 
}

$frontendStatus = try { 
    $null = curl -s "http://localhost:3002" 2>/dev/null
    $LASTEXITCODE -eq 0
} catch { 
    $false 
}

Write-Host "Backend (API): $(if ($backendStatus) { 'Running ✓' } else { 'Not Running ✗' })" -ForegroundColor $(if ($backendStatus) { 'Green' } else { 'Red' })
Write-Host "Frontend (3002): $(if ($frontendStatus) { 'Running ✓' } else { 'Not Running ✗' })" -ForegroundColor $(if ($frontendStatus) { 'Green' } else { 'Red' })
Write-Host ""

if (-not $backendStatus) {
    Write-Host "Starting Backend API (port 8000)..." -ForegroundColor Yellow
    Write-Host "Command: cd backend && python main.py" -ForegroundColor Gray
    Write-Host "Note: Run in a separate terminal" -ForegroundColor Cyan
}

if (-not $frontendStatus) {
    Write-Host "Starting Frontend (port 3002)..." -ForegroundColor Yellow
    Write-Host "Command: npm run dev -- -p 3002" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Running frontend..." -ForegroundColor Cyan
    & npm run dev -- -p 3002
}
