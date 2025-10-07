# Recommended Open Source Chatbot UIs for GAFF

Instead of building from scratch, use these battle-tested open-source UIs.

## 🏆 Top Recommendations

### 1. Open WebUI ⭐ BEST CHOICE
**Repo:** https://github.com/open-webui/open-webui  
**Stars:** 50k+  
**License:** MIT

**Why Choose This:**
- Modern, polished interface
- Multi-user with authentication
- Document uploads and RAG
- Voice input support
- Mobile responsive
- Active development
- Docker deployment

**Quick Start:**
```bash
docker run -d -p 3000:8080 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main
```

**GAFF Integration:**
Use the OpenAI-compatible API adapter (see below).

---

### 2. LibreChat
**Repo:** https://github.com/danny-avila/LibreChat  
**Stars:** 20k+  
**License:** MIT

**Why Choose This:**
- ChatGPT-like experience
- Multi-provider support
- Plugin system
- Conversation branching
- Enterprise features

**Quick Start:**
```bash
git clone https://github.com/danny-avila/LibreChat.git
cd LibreChat
docker compose up -d
```

---

### 3. Chatbot UI (Next.js)
**Repo:** https://github.com/mckaywrigley/chatbot-ui  
**Stars:** 28k+  
**License:** MIT

**Why Choose This:**
- Clean, minimal design
- Easy to customize
- Next.js based
- Lightweight
- Good for prototyping

**Quick Start:**
```bash
git clone https://github.com/mckaywrigley/chatbot-ui.git
cd chatbot-ui
npm install
npm run dev
```

---

### 4. BetterChatGPT
**Repo:** https://github.com/ztjhz/BetterChatGPT  
**Stars:** 8k+  
**License:** Creative Commons Zero

**Why Choose This:**
- No backend needed
- Pure frontend
- Runs locally
- Privacy-focused
- Easiest deployment

**Quick Start:**
Just deploy the static files or use: https://bettergpt.chat

---

## 🔌 GAFF Integration Options

### Option 1: OpenAI-Compatible API Adapter (Recommended)

Most UIs support OpenAI's API format. Create an adapter:

```javascript
// ui/openai-adapter.js
import express from 'express';
import { callGaffGateway } from './gaff-client.js';

const app = express();
app.use(express.json());

// OpenAI-compatible endpoint
app.post('/v1/chat/completions', async (req, res) => {
  const { messages, stream = false } = req.body;
  
  // Get last user message
  const userMessage = messages.filter(m => m.role === 'user').pop()?.content;
  
  // Call GAFF
  const result = await callGaffGateway('gaff_create_and_execute_workflow', {
    query: userMessage,
    options: { validate_safety: true, quality_check: true }
  });
  
  // Format as OpenAI response
  const response = {
    id: `gaff-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gaff-gateway',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: result.content[0].text
      },
      finish_reason: 'stop'
    }]
  };
  
  if (stream) {
    // Handle streaming if needed
    res.setHeader('Content-Type', 'text/event-stream');
    res.write(`data: ${JSON.stringify(response)}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } else {
    res.json(response);
  }
});

app.listen(3100, () => {
  console.log('🔌 OpenAI-compatible adapter running on http://localhost:3100');
  console.log('📝 Configure your UI to use: http://localhost:3100/v1');
});
```

**Then configure your UI:**
```env
# In Open WebUI or LibreChat
OPENAI_API_BASE=http://localhost:3100/v1
OPENAI_API_KEY=dummy-key-not-used
```

---

### Option 2: Custom Integration

Use the GAFF HTTP API directly:

```javascript
// In your chosen UI's backend
async function callGaff(message) {
  const response = await fetch('http://localhost:3200/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message,
      options: { validate_safety: true }
    })
  });
  
  const data = await response.json();
  return data.response;
}
```

---

## 🎨 Customization Guide

### For Open WebUI

1. **Branding:**
```bash
# Set environment variables
WEBUI_NAME="GAFF Assistant"
WEBUI_DESCRIPTION="AI orchestration with GAFF"
```

2. **Custom CSS:**
Add in the UI settings → Appearance → Custom CSS

3. **System Prompt:**
Configure in Settings → Models → System Prompt

### For Chatbot UI

1. **Edit `app/page.tsx`:**
```typescript
// Change title, description, etc.
export const metadata = {
  title: 'GAFF Assistant',
  description: 'AI-powered workflow orchestration',
}
```

2. **Theme:**
Edit `tailwind.config.js` for colors

3. **Features:**
Enable/disable in `utils/app/const.ts`

---

## 📦 Complete Setup Example

### Using Open WebUI + GAFF

**1. Start GAFF OpenAI Adapter:**
```bash
cd gaff/ui
node openai-adapter.js
```

**2. Start Open WebUI:**
```bash
docker run -d -p 3000:8080 \
  -e OPENAI_API_BASE_URL=http://host.docker.internal:3100/v1 \
  -e OPENAI_API_KEY=dummy \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main
```

**3. Access:**
Open http://localhost:3000

**4. Configure:**
- Go to Settings → Connections
- Verify GAFF endpoint is connected
- Start chatting!

---

## 🆚 Comparison

| Feature | Open WebUI | LibreChat | Chatbot UI | BetterChatGPT |
|---------|-----------|-----------|------------|---------------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **UI Polish** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Features** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Customization** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Multi-user** | ✅ | ✅ | ❌ | ❌ |
| **Docker** | ✅ | ✅ | ✅ | ❌ |
| **Auth** | ✅ | ✅ | ❌ | ❌ |
| **Mobile** | ✅ | ✅ | ✅ | ✅ |
| **Backend Required** | ✅ | ✅ | ✅ | ❌ |

---

## 🎯 Our Recommendation

**For Production:** Use **Open WebUI**
- Most polished
- Best features
- Active development
- Docker ready
- Multi-user support

**For Development:** Use **Chatbot UI**
- Easy to customize
- Simple codebase
- Quick setup
- Good for prototyping

**For Quick Demo:** Use **BetterChatGPT**
- No installation
- Just works
- Privacy-focused
- Good for testing

---

## 📚 Next Steps

1. **Choose a UI** from the options above
2. **Deploy the OpenAI adapter** (see `ui/openai-adapter.js`)
3. **Configure the UI** to point to the adapter
4. **Customize** branding, colors, prompts
5. **Deploy** to your preferred hosting

---

## 🔗 Resources

- Open WebUI Docs: https://docs.openwebui.com
- LibreChat Docs: https://www.librechat.ai/docs
- GAFF Documentation: [../README.md](../README.md)
- OpenAI API Reference: https://platform.openai.com/docs/api-reference

---

## 💡 Pro Tips

1. **Use Docker Compose** to run both GAFF adapter and UI together
2. **Add authentication** before exposing publicly
3. **Set up SSL/TLS** for production
4. **Monitor usage** with analytics
5. **Back up conversations** regularly

---

## Author

Sean Poyner <sean.poyner@pm.me>

## License

See individual project licenses. GAFF components are MIT licensed.

