# GAFF WebUI Dependency Check Script
# Run from gaff/ root directory

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  GAFF WebUI Dependency Check" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$allGood = $true

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host " ✅ $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host " ❌ NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host " ❌ NOT FOUND" -ForegroundColor Red
    $allGood = $false
}

# Check npm
Write-Host "Checking npm..." -NoNewline
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host " ✅ v$npmVersion" -ForegroundColor Green
    } else {
        Write-Host " ❌ NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host " ❌ NOT FOUND" -ForegroundColor Red
    $allGood = $false
}

# Check UI dependencies
Write-Host "Checking UI dependencies..." -NoNewline
if (Test-Path "ui\node_modules") {
    Write-Host " ✅ Installed" -ForegroundColor Green
} else {
    Write-Host " ❌ NOT installed" -ForegroundColor Red
    Write-Host "   → Run: cd ui; npm install" -ForegroundColor Yellow
    $allGood = $false
}

# Check Agent dependencies
Write-Host "Checking Agent dependencies..." -NoNewline
if (Test-Path "agents\node_modules") {
    Write-Host " ✅ Installed" -ForegroundColor Green
} else {
    Write-Host " ❌ NOT installed" -ForegroundColor Red
    Write-Host "   → Run: cd agents; npm install" -ForegroundColor Yellow
    $allGood = $false
}

# Check MCP servers
Write-Host "`nChecking MCP Servers:" -ForegroundColor Cyan

$mcpServers = @(
    @{Name="Agent Orchestration"; Path="mcp\agent-orchestration\build\index.js"},
    @{Name="Intent Graph Generator"; Path="mcp\intent-graph-generator\build\index.js"},
    @{Name="Router"; Path="mcp\router\build\index.js"},
    @{Name="GAFF Gateway"; Path="mcp\gaff-gateway\build\index.js"},
    @{Name="Quality Check"; Path="mcp\quality-check\build\index.js"},
    @{Name="Safety Protocols"; Path="mcp\safety-protocols\build\index.js"}
)

foreach ($server in $mcpServers) {
    Write-Host "  $($server.Name)..." -NoNewline
    if (Test-Path $server.Path) {
        Write-Host " ✅ Built" -ForegroundColor Green
    } else {
        Write-Host " ❌ NOT built" -ForegroundColor Red
        $dir = Split-Path $server.Path -Parent | Split-Path -Parent
        Write-Host "     → Run: cd $dir; npm run build" -ForegroundColor Yellow
        $allGood = $false
    }
}

# Check Example Agents
Write-Host "`nChecking Example Agents:" -ForegroundColor Cyan
$agentFiles = @(
    "agents\examples\simple-chatbot-agent.js",
    "agents\examples\workflow-demo-agent.js"
)

foreach ($file in $agentFiles) {
    $name = Split-Path $file -Leaf
    Write-Host "  $name..." -NoNewline
    if (Test-Path $file) {
        Write-Host " ✅ Built" -ForegroundColor Green
    } else {
        Write-Host " ❌ NOT built" -ForegroundColor Red
        Write-Host "     → Run: cd agents; npm run build" -ForegroundColor Yellow
        $allGood = $false
    }
}

# Check API key
Write-Host "`nChecking Environment:" -ForegroundColor Cyan
Write-Host "  WRITER_API_KEY..." -NoNewline
if ($env:WRITER_API_KEY) {
    $keyPreview = $env:WRITER_API_KEY.Substring(0, [Math]::Min(10, $env:WRITER_API_KEY.Length))
    Write-Host " ✅ Set ($keyPreview...)" -ForegroundColor Green
} else {
    Write-Host " ⚠️  NOT set" -ForegroundColor Yellow
    Write-Host "     → Required for LLM operations" -ForegroundColor Yellow
    Write-Host "     → Set in Windows System Environment or: `$env:WRITER_API_KEY='your-key'" -ForegroundColor Yellow
}

# Check gaff.json
Write-Host "  gaff.json..." -NoNewline
if (Test-Path "gaff.json") {
    Write-Host " ✅ Found" -ForegroundColor Green
} else {
    Write-Host " ❌ NOT found" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host "`n============================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  ✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "  Ready to start WebUI: cd ui; npm start" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  SOME ISSUES FOUND" -ForegroundColor Yellow
    Write-Host "  Fix the issues above before starting" -ForegroundColor Yellow
}
Write-Host "============================================`n" -ForegroundColor Cyan

# Quick start instructions
Write-Host "Quick Start Commands:" -ForegroundColor Cyan
Write-Host "  Test Example Agent: cd ui; node test-quick-start.js" -ForegroundColor White
Write-Host "  Start OpenAI Adapter: cd ui; npm start" -ForegroundColor White
Write-Host "  Start with Docker: cd ui; docker-compose up -d" -ForegroundColor White
Write-Host ""
