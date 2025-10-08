# GAFF Chatbot UI

**Out-of-the-box UI options for GAFF**

Instead of building from scratch, GAFF integrates with popular open-source chatbot UIs through an OpenAI-compatible adapter.

## 🚀 Quick Start (Recommended)

### Option 1: Open WebUI + Docker Compose

```bash
cd gaff/ui
npm install
docker-compose up -d
```

Then open: http://localhost:3000

### Option 2: Any OpenAI-Compatible UI

1. **Start the adapter:**
```bash
cd gaff/ui
npm install
node openai-adapter.js
```

2. **Configure your UI:**
```env
OPENAI_API_BASE=http://localhost:3100/v1
OPENAI_API_KEY=dummy-key-not-used
```

## 📱 Recommended UIs

### 1. Open WebUI ⭐ Best Choice
- Modern interface
- Multi-user support
- Document uploads
- Voice input
- **Setup:** See [RECOMMENDED_UIS.md](RECOMMENDED_UIS.md#1-open-webui--best-choice)

### 2. LibreChat
- ChatGPT-like experience
- Plugin system
- Enterprise features
- **Setup:** See [RECOMMENDED_UIS.md](RECOMMENDED_UIS.md#2-librechat)

### 3. Chatbot UI
- Clean, minimal
- Easy to customize
- Next.js based
- **Setup:** See [RECOMMENDED_UIS.md](RECOMMENDED_UIS.md#3-chatbot-ui-nextjs)

### 4. BetterChatGPT
- No backend needed
- Privacy-focused
- Quick demo
- **Setup:** See [RECOMMENDED_UIS.md](RECOMMENDED_UIS.md#4-betterchatgpt)

## 🔌 How It Works

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Your UI   │──────▶│ OpenAI       │──────▶│    GAFF     │
│ (Open WebUI)│       │ Adapter      │       │   Gateway   │
│             │◀──────│ :3100        │◀──────│             │
└─────────────┘       └──────────────┘       └─────────────┘
                      Translates OpenAI      All 17+ GAFF
                      format to GAFF MCP     tools available
```

## 📚 Complete Documentation

See [RECOMMENDED_UIS.md](RECOMMENDED_UIS.md) for:
- Detailed setup guides
- Feature comparisons
- Customization instructions
- Integration examples

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start adapter
node openai-adapter.js

# Or use the basic server
node server.js
```

## 🧪 Testing

### Quick Tests

```bash
# Check all dependencies
.\test-dependencies.ps1

# Quick functional test
node test-quick-start.js
```

### Advanced Tests

For component testing and debugging, see [`tests/README.md`](tests/README.md):
- Individual component tests
- Integration test suite
- Debugging tools

## 🐳 Docker Deployment

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📖 API Endpoints

### OpenAI Adapter (Port 3100)
- `POST /v1/chat/completions` - Chat with GAFF
- `GET /v1/models` - List models
- `GET /health` - Health check

### Basic Server (Port 3200)
- `POST /api/chat` - Simple chat endpoint
- `POST /api/tool` - Call specific GAFF tool
- `GET /api/tools` - List all tools
- `GET /api/health` - Health check

## 🎨 Customization

Each UI has different customization options. See the [RECOMMENDED_UIS.md](RECOMMENDED_UIS.md#-customization-guide) guide.

## 🔒 Security

**Before deploying to production:**
1. Add authentication
2. Enable HTTPS/TLS
3. Set up rate limiting
4. Configure CORS properly
5. Use environment variables for secrets

## 📦 What's Included

- `openai-adapter.js` - OpenAI-compatible API adapter
- `server.js` - Basic HTTP server for GAFF
- `docker-compose.yml` - Full stack deployment
- `RECOMMENDED_UIS.md` - Complete UI guide

## 🤝 Contributing

Contributions welcome! See main GAFF [README](../README.md).

## 📄 License

MIT - See LICENSE file in repository root

## 👤 Author

Sean Poyner <sean.poyner@pm.me>

## 🔗 Links

- [GAFF Main README](../README.md)
- [GAFF Gateway](../mcp/gaff-gateway/README.md)
- [Open WebUI](https://github.com/open-webui/open-webui)
- [LibreChat](https://github.com/danny-avila/LibreChat)

