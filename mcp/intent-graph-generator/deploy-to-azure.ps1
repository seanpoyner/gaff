#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy IntentGraph MCP Server to Azure Functions

.DESCRIPTION
    Automated deployment script for Azure Functions integration with Copilot Studio

.PARAMETER ResourceGroup
    Azure resource group name (default: intent-graph-rg)

.PARAMETER Location
    Azure region (default: eastus)

.PARAMETER FunctionAppName
    Function app name (default: intent-graph-mcp)

.PARAMETER LLM_API_KEY
    LLM API key (Writer, OpenAI, or Anthropic)

.PARAMETER LLM_MODEL
    LLM model name (default: palmyra-x5)

.PARAMETER LLM_BASE_URL
    LLM API base URL (default: https://api.writer.com)

.EXAMPLE
    .\deploy-to-azure.ps1 -LLM_API_KEY "your-key" -LLM_MODEL "palmyra-x5"
#>

[CmdletBinding()]
param(
    [string]$ResourceGroup = "intent-graph-rg",
    [string]$Location = "eastus",
    [string]$FunctionAppName = "intent-graph-mcp-$(Get-Random -Minimum 1000 -Maximum 9999)",
    [Parameter(Mandatory=$true)]
    [string]$LLM_API_KEY,
    [string]$LLM_MODEL = "palmyra-x5",
    [string]$LLM_BASE_URL = "https://api.writer.com"
)

Write-Host "🚀 Deploying IntentGraph MCP Server to Azure Functions..." -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI not found. Install from: https://aka.ms/installazurecli" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Install from: https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites OK" -ForegroundColor Green
Write-Host ""

# Login to Azure
Write-Host "Logging in to Azure..." -ForegroundColor Yellow
az account show 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    az login
}
Write-Host "✅ Logged in" -ForegroundColor Green
Write-Host ""

# Build project
Write-Host "Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build complete" -ForegroundColor Green
Write-Host ""

# Create resource group
Write-Host "Creating resource group: $ResourceGroup..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none
Write-Host "✅ Resource group created" -ForegroundColor Green
Write-Host ""

# Create storage account
$StorageName = "igstore$(Get-Random -Minimum 10000 -Maximum 99999)"
Write-Host "Creating storage account: $StorageName..." -ForegroundColor Yellow
az storage account create `
    --name $StorageName `
    --location $Location `
    --resource-group $ResourceGroup `
    --sku Standard_LRS `
    --output none
Write-Host "✅ Storage account created" -ForegroundColor Green
Write-Host ""

# Create function app
Write-Host "Creating function app: $FunctionAppName..." -ForegroundColor Yellow
az functionapp create `
    --resource-group $ResourceGroup `
    --consumption-plan-location $Location `
    --runtime node `
    --runtime-version 18 `
    --functions-version 4 `
    --name $FunctionAppName `
    --storage-account $StorageName `
    --output none
Write-Host "✅ Function app created" -ForegroundColor Green
Write-Host ""

# Configure app settings
Write-Host "Configuring environment variables..." -ForegroundColor Yellow
az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --settings `
        "LLM_API_KEY=$LLM_API_KEY" `
        "LLM_MODEL=$LLM_MODEL" `
        "LLM_BASE_URL=$LLM_BASE_URL" `
    --output none
Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host ""

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
if (Test-Path deploy.zip) {
    Remove-Item deploy.zip
}
Compress-Archive -Path build, azure-function, node_modules, package.json, package-lock.json -DestinationPath deploy.zip -Force
Write-Host "✅ Package created" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "Deploying to Azure (this may take 2-3 minutes)..." -ForegroundColor Yellow
az functionapp deployment source config-zip `
    --resource-group $ResourceGroup `
    --name $FunctionAppName `
    --src deploy.zip `
    --output none

Write-Host "✅ Deployed successfully" -ForegroundColor Green
Write-Host ""

# Get function URL
$FunctionURL = az functionapp show `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --query "defaultHostName" `
    --output tsv

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 DEPLOYMENT INFORMATION" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Health Check:   https://$FunctionURL/api/health" -ForegroundColor White
Write-Host "🔗 MCP Endpoint:   https://$FunctionURL/api/mcp" -ForegroundColor White
Write-Host "📦 Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "⚡ Function App:   $FunctionAppName" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 COPILOT STUDIO SETUP" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://copilotstudio.microsoft.com" -ForegroundColor Yellow
Write-Host "2. Select your Copilot → Tools → Add a tool → New tool" -ForegroundColor Yellow
Write-Host "3. Select 'Model Context Protocol'" -ForegroundColor Yellow
Write-Host "4. Fill in:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Server name:        intent-graph-generator" -ForegroundColor White
Write-Host "   Server description: Generates AI-powered intent graphs for multi-agent workflows" -ForegroundColor White
Write-Host "   Server URL:         https://$FunctionURL/api/mcp" -ForegroundColor Green
Write-Host "   Authentication:     No authentication" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Test health endpoint
Write-Host "Testing health endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $health = Invoke-RestMethod -Uri "https://$FunctionURL/api/health" -Method GET
    Write-Host "✅ Server is healthy!" -ForegroundColor Green
    Write-Host "   Status:    $($health.status)" -ForegroundColor White
    Write-Host "   Version:   $($health.version)" -ForegroundColor White
    Write-Host "   Tools:     $($health.tools)" -ForegroundColor White
} catch {
    Write-Host "⚠️  Server is starting up (may take 30-60 seconds)" -ForegroundColor Yellow
    Write-Host "   Try again in a minute: curl https://$FunctionURL/api/health" -ForegroundColor White
}

Write-Host ""
Write-Host "🎊 All done! Your IntentGraph MCP Server is ready for Copilot Studio!" -ForegroundColor Green
Write-Host ""

# Clean up deployment package
Remove-Item deploy.zip

