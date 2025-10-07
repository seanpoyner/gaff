#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start GAFF with Open WebUI
    
.DESCRIPTION
    Starts the GAFF OpenAI adapter and Open WebUI with MCP integration
    
.NOTES
    Author: Sean Poyner <sean.poyner@pm.me>
#>

[CmdletBinding()]
param()

Write-Host "`n$('=' * 70)" -ForegroundColor Cyan
Write-Host "🚀 Starting GAFF with Open WebUI" -ForegroundColor Cyan
Write-Host "$('=' * 70)`n" -ForegroundColor Cyan

# Set GAFF config path
$env:GAFF_CONFIG_PATH = Join-Path $PSScriptRoot ".." "gaff.json"
Write-Host "📝 GAFF Config: $env:GAFF_CONFIG_PATH" -ForegroundColor Green

# Check if port 3100 is in use
$port3100 = Get-NetTCPConnection -LocalPort 3100 -ErrorAction SilentlyContinue
if ($port3100) {
    Write-Host "⚠️  Port 3100 is in use, stopping existing process..." -ForegroundColor Yellow
    $pid = $port3100[0].OwningProcess
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Check if Open WebUI container exists
$container = docker ps -a --filter "name=open-webui" --format "{{.Names}}" 2>$null
if ($container -eq "open-webui") {
    Write-Host "🗑️  Removing existing Open WebUI container..." -ForegroundColor Yellow
    docker stop open-webui 2>$null | Out-Null
    docker rm open-webui 2>$null | Out-Null
}

# Start GAFF OpenAI Adapter in background
Write-Host "`n📡 Starting GAFF OpenAI Adapter on port 3100..." -ForegroundColor Cyan
$adapterJob = Start-Job -ScriptBlock {
    param($uiPath, $configPath)
    $env:GAFF_CONFIG_PATH = $configPath
    Set-Location $uiPath
    node openai-adapter.js
} -ArgumentList $PSScriptRoot, $env:GAFF_CONFIG_PATH

Start-Sleep -Seconds 3

# Check if adapter started
$port = Get-NetTCPConnection -LocalPort 3100 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "✅ GAFF OpenAI Adapter running on http://localhost:3100" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start adapter. Check logs:" -ForegroundColor Red
    Receive-Job -Job $adapterJob
    exit 1
}

# Start Open WebUI with MCP support
Write-Host "`n🌐 Starting Open WebUI on port 8080..." -ForegroundColor Cyan
docker run -d `
    -p 8080:8080 `
    --add-host=host.docker.internal:host-gateway `
    -v open-webui:/app/backend/data `
    --name open-webui `
    --restart always `
    ghcr.io/open-webui/open-webui:main | Out-Null

Start-Sleep -Seconds 5

# Check if Open WebUI started
$webui = docker ps --filter "name=open-webui" --format "{{.Names}}" 2>$null
if ($webui -eq "open-webui") {
    Write-Host "✅ Open WebUI running on http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start Open WebUI" -ForegroundColor Red
    exit 1
}

Write-Host "`n$('=' * 70)" -ForegroundColor Green
Write-Host "🎉 GAFF is ready!" -ForegroundColor Green
Write-Host "$('=' * 70)`n" -ForegroundColor Green

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open http://localhost:8080 in your browser" -ForegroundColor White
Write-Host "2. Go to Settings → Connections → OpenAI" -ForegroundColor White
Write-Host "3. Click the '+' button and add:" -ForegroundColor White
Write-Host "   • API Base URL: http://host.docker.internal:3100/v1" -ForegroundColor Cyan
Write-Host "   • API Key: dummy-key-not-used" -ForegroundColor Cyan
Write-Host "4. Select 'gaff-gateway' model in the chat dropdown" -ForegroundColor White
Write-Host ""
Write-Host "💡 Test with: 'Analyze customer satisfaction from last quarter'" -ForegroundColor Yellow
Write-Host ""
Write-Host "🛑 To stop: Press Ctrl+C, then run:" -ForegroundColor Red
Write-Host "   docker stop open-webui; docker rm open-webui" -ForegroundColor Red
Write-Host "   Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Red
Write-Host "`n$('=' * 70)`n" -ForegroundColor Cyan

# Keep script running and show adapter logs
Write-Host "📊 Adapter Logs (Ctrl+C to stop):" -ForegroundColor Cyan
Write-Host "$('-' * 70)`n" -ForegroundColor Gray

try {
    while ($true) {
        Receive-Job -Job $adapterJob
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`n👋 Shutting down..." -ForegroundColor Yellow
    Stop-Job -Job $adapterJob -ErrorAction SilentlyContinue
    Remove-Job -Job $adapterJob -ErrorAction SilentlyContinue
    docker stop open-webui 2>$null | Out-Null
    docker rm open-webui 2>$null | Out-Null
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}


