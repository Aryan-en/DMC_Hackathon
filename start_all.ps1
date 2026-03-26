#!/usr/bin/env pwsh
param(
    [ValidateSet('docker', 'local', 'lite')]
    [string]$Mode = 'docker',
    [int]$FrontendPort = 3000
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Write-Section($text) {
    Write-Host "`n=== $text ===" -ForegroundColor Cyan
}

function Start-NewTerminal($title, $command) {
    $wrapped = "`$Host.UI.RawUI.WindowTitle = '$title'; $command"
    Start-Process powershell -ArgumentList '-NoExit', '-Command', $wrapped | Out-Null
}

function Test-CommandExists($name) {
    return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists 'docker')) {
    throw 'Docker is not installed or not available in PATH.'
}
if (-not (Test-CommandExists 'npm')) {
    throw 'npm is not installed or not available in PATH.'
}

Write-Section "ONTORA Startup ($Mode mode)"
Write-Host "Workspace: $root" -ForegroundColor Gray

$composeFile = Join-Path $root 'infra/docker/docker-compose.yml'
if (-not (Test-Path $composeFile)) {
    throw "Compose file not found: $composeFile"
}
$liteComposeFile = Join-Path $root 'infra/docker/docker-compose.lite.yml'
if (-not (Test-Path $liteComposeFile)) {
    throw "Lite compose file not found: $liteComposeFile"
}

if ($Mode -eq 'docker') {
    Write-Section 'Starting full Docker stack (API + Celery + DB + Infra)'
    docker compose -f $composeFile up -d --build

    Write-Section 'Starting frontend in new terminal'
    $frontendCmd = "Set-Location '$root'; npm install; npm run dev -- -p $FrontendPort"
    Start-NewTerminal 'ONTORA Frontend' $frontendCmd

    Write-Section 'Health endpoints'
    Write-Host "Frontend: http://localhost:$FrontendPort" -ForegroundColor Green
    Write-Host 'Backend:  http://localhost:8000/health' -ForegroundColor Green
    Write-Host 'Docs:     http://localhost:8000/docs' -ForegroundColor Green
    Write-Host 'Neo4j:    http://localhost:7474' -ForegroundColor Green
    Write-Host 'Grafana:  http://localhost:3001' -ForegroundColor Green
    Write-Host 'Prom:     http://localhost:9090' -ForegroundColor Green
}
elseif ($Mode -eq 'local') {
    Write-Section 'Starting infra containers only (DB/Redis/Kafka/Neo4j)'
    docker compose -f $composeFile up -d postgres neo4j redis zookeeper kafka-1 kafka-2 kafka-3

    $venvActivate = Join-Path $root '.venv/Scripts/Activate.ps1'
    if (-not (Test-Path $venvActivate)) {
        throw "Virtual env activation script not found: $venvActivate"
    }

    Write-Section 'Starting backend API in new terminal'
    $apiCmd = "Set-Location '$root'; & '$venvActivate'; Set-Location '$root/backend'; python main.py"
    Start-NewTerminal 'ONTORA Backend API' $apiCmd

    Write-Section 'Starting celery worker in new terminal'
    $workerCmd = "Set-Location '$root'; & '$venvActivate'; Set-Location '$root/backend'; celery -A core.celery_app worker --loglevel=info --pool=solo"
    Start-NewTerminal 'ONTORA Celery Worker' $workerCmd

    Write-Section 'Starting celery beat in new terminal'
    $beatCmd = "Set-Location '$root'; & '$venvActivate'; Set-Location '$root/backend'; celery -A core.celery_app beat --loglevel=info"
    Start-NewTerminal 'ONTORA Celery Beat' $beatCmd

    Write-Section 'Starting frontend in new terminal'
    $frontendCmd = "Set-Location '$root'; npm install; npm run dev -- -p $FrontendPort"
    Start-NewTerminal 'ONTORA Frontend' $frontendCmd

    Write-Section 'Health endpoints'
    Write-Host "Frontend: http://localhost:$FrontendPort" -ForegroundColor Green
    Write-Host 'Backend:  http://localhost:8000/health' -ForegroundColor Green
    Write-Host 'Docs:     http://localhost:8000/docs' -ForegroundColor Green
}
else {
    Write-Section 'Stopping full stack containers to avoid port collisions'
    docker compose -f $composeFile down

    Write-Section 'Starting lite infra containers (DB/Redis/Neo4j/Single Kafka)'
    docker compose -f $liteComposeFile up -d

    $venvActivate = Join-Path $root '.venv/Scripts/Activate.ps1'
    if (-not (Test-Path $venvActivate)) {
        throw "Virtual env activation script not found: $venvActivate"
    }

    Write-Section 'Starting backend API in new terminal'
    $apiCmd = "Set-Location '$root'; & '$venvActivate'; Set-Location '$root/backend'; python main.py"
    Start-NewTerminal 'ONTORA Backend API (Lite)' $apiCmd

    Write-Section 'Starting celery worker in new terminal'
    $workerCmd = "Set-Location '$root'; & '$venvActivate'; Set-Location '$root/backend'; celery -A core.celery_app worker --loglevel=info --pool=solo"
    Start-NewTerminal 'ONTORA Celery Worker (Lite)' $workerCmd

    Write-Section 'Starting frontend in new terminal'
    $frontendCmd = "Set-Location '$root'; npm install; npm run dev -- -p $FrontendPort"
    Start-NewTerminal 'ONTORA Frontend (Lite)' $frontendCmd

    Write-Section 'Health endpoints'
    Write-Host "Frontend: http://localhost:$FrontendPort" -ForegroundColor Green
    Write-Host 'Backend:  http://localhost:8000/health' -ForegroundColor Green
    Write-Host 'Docs:     http://localhost:8000/docs' -ForegroundColor Green
    Write-Host 'Neo4j:    http://localhost:7474' -ForegroundColor Green
}

Write-Section 'Done'
Write-Host "Use this to stop Docker services:" -ForegroundColor Yellow
if ($Mode -eq 'lite') {
    Write-Host "docker compose -f $liteComposeFile down" -ForegroundColor Yellow
} else {
    Write-Host "docker compose -f $composeFile down" -ForegroundColor Yellow
}
