# Open WebUI + GAFF Quick Start

## 🎯 Option 1: Docker Compose (Recommended)

### Step 1: Ensure GAFF Gateway is built
```bash
cd C:\Users\seanp\projects\gaff\mcp\gaff-gateway
npm install
npm run build
```

### Step 2: Start Open WebUI + GAFF
```bash
cd C:\Users\seanp\projects\gaff\ui
docker-compose up -d
```

### Step 3: Access the UI
Open your browser to: **http://localhost:3000**

### Step 4: First Time Setup
1. Create your account (first user becomes admin)
2. The UI is already connected to GAFF!
3. Start chatting!

---

## 🎯 Option 2: Without Docker (Manual)

### Step 1: Start GAFF Adapter
```bash
cd C:\Users\seanp\projects\gaff\ui
npm install
npm start
```

Keep this terminal running (GAFF adapter on port 3100)

### Step 2: Install Open WebUI with pip
```bash
pip install open-webui
```

### Step 3: Configure Environment
```bash
$env:OPENAI_API_BASE_URL="http://localhost:3100/v1"
$env:OPENAI_API_KEY="dummy-key-not-used"
$env:WEBUI_NAME="GAFF Assistant"
```

### Step 4: Start Open WebUI
```bash
open-webui serve
```

### Step 5: Access
Open: **http://localhost:8080**

---

## 🎨 Customization

### Change Branding
Edit `docker-compose.yml`:
```yaml
environment:
  - WEBUI_NAME=My Custom Assistant
  - WEBUI_DESCRIPTION=Powered by GAFF
```

### Change Port
Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:8080"  # Change first number
```

### Add Authentication Settings
```yaml
environment:
  - ENABLE_SIGNUP=true
  - DEFAULT_USER_ROLE=user
```

---

## 🔧 Useful Commands

### View Logs
```bash
docker-compose logs -f
```

### Restart Services
```bash
docker-compose restart
```

### Stop Everything
```bash
docker-compose down
```

### Update to Latest
```bash
docker-compose pull
docker-compose up -d
```

---

## 💬 Using GAFF in Open WebUI

### Basic Chat
Just type your message! It automatically uses GAFF's workflow orchestration.

### Example Queries
- "Process customer data and generate a report"
- "Analyze this data and store results in memory"
- "Execute Python code to calculate statistics"
- "Use sequential thinking to plan a complex workflow"

### Available Tools
All 17+ GAFF tools are available through the chat interface:
- Memory operations
- Code execution (sandbox)
- Sequential thinking
- Workflow orchestration
- Quality checks
- Safety validation
- And more!

---

## 🐛 Troubleshooting

### "Can't connect to GAFF"
1. Check adapter is running:
   ```bash
   curl http://localhost:3100/health
   ```

2. Check gateway is built:
   ```bash
   cd mcp/gaff-gateway
   npm run build
   ```

### Docker issues
1. Ensure Docker is running
2. Check ports aren't in use:
   ```bash
   netstat -ano | findstr :3000
   netstat -ano | findstr :3100
   ```

### Adapter won't start
1. Check Node.js version:
   ```bash
   node --version  # Should be 18+
   ```

2. Reinstall dependencies:
   ```bash
   cd ui
   rm -rf node_modules
   npm install
   ```

---

## 📚 Advanced Features

### Multi-User Setup
First user becomes admin. Create more accounts in Settings → Users.

### Document Chat (RAG)
Upload documents in the chat interface to have GAFF analyze them.

### Voice Input
Click the microphone icon to use voice input.

### Export Conversations
Settings → Export Data to backup your chats.

---

## 🔗 Resources

- Open WebUI Docs: https://docs.openwebui.com
- GAFF Documentation: [../README.md](../README.md)
- API Reference: [openai-adapter.js](openai-adapter.js)

---

## Author
Sean Poyner <sean.poyner@pm.me>

