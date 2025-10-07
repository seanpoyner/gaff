# 📚 IntentGraph MCP Server Documentation Index

**Version:** 2.1.0  
**Last Updated:** October 4, 2025

---

## 🎯 Getting Started

| Document | Description | Audience |
|----------|-------------|----------|
| [README.md](./README.md) | **Main documentation** - Quick start, features, installation, configuration | Everyone |
| [RELEASE-NOTES-v2.1.0.md](./RELEASE-NOTES-v2.1.0.md) | **What's new in v2.1** - New features, breaking changes, upgrade guide | Existing users |

---

## 🚀 Setup & Configuration

| Document | Description | Use When |
|----------|-------------|----------|
| [CLAUDE-DESKTOP-SETUP.md](./CLAUDE-DESKTOP-SETUP.md) | Configure for Claude Desktop | Using with Claude Desktop |
| [COPILOT-STUDIO-SETUP.md](./COPILOT-STUDIO-SETUP.md) | Configure for Microsoft Copilot Studio | Using with Copilot Studio |
| [AZURE-DEPLOYMENT.md](./AZURE-DEPLOYMENT.md) | Deploy to Azure Functions | Enterprise/cloud deployment |

---

## ✨ v2.1.0 Features (NEW)

| Document | Feature | Description |
|----------|---------|-------------|
| [GENERATION-MODES.md](./GENERATION-MODES.md) | **Flexible LLM Modes** | `delegate_to_caller` vs `use_configured_api` |
| [SYSTEM-CONFIGURABLE-GENERATION.md](./SYSTEM-CONFIGURABLE-GENERATION.md) | **Custom Systems** | Domain-specific prompts and schemas |
| [MEMORY-DIRECT-INTEGRATION.md](./MEMORY-DIRECT-INTEGRATION.md) | **Memory Architecture** | How direct memory integration works |
| [MEMORY-CACHING.md](./MEMORY-CACHING.md) | **Memory Caching** | State persistence with memory MCP server |
| [MEMORY-QUICK-START.md](./MEMORY-QUICK-START.md) | **Quick Reference** | Fast lookup for memory features |
| [ENHANCED-VISUALIZATION.md](./ENHANCED-VISUALIZATION.md) | **Rich Diagrams** | Modern Mermaid with colors and icons |

---

## 📖 Feature Guides

| Document | Feature | Description |
|----------|---------|-------------|
| [AGENT-INSTRUCTIONS-FEATURE.md](./AGENT-INSTRUCTIONS-FEATURE.md) | Agent Instructions | Adding instructions to nodes |
| [MCP-TOOLS-FEATURE.md](./MCP-TOOLS-FEATURE.md) | MCP Tools | Tool assignment to agents |
| [VISUALIZATION-ENHANCEMENT-SUMMARY.md](./VISUALIZATION-ENHANCEMENT-SUMMARY.md) | Visualization | Enhanced diagram features |
| [VISUALIZATION-QUICK-START.md](./VISUALIZATION-QUICK-START.md) | Visualization | Quick start guide |

---

## 🔧 Implementation Details

| Document | Topic | Description |
|----------|-------|-------------|
| [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) | Architecture | System design and components |
| [FLEXIBLE-GENERATION-SUMMARY.md](./FLEXIBLE-GENERATION-SUMMARY.md) | Implementation | Flexible generation modes details |
| [IMPLEMENTATION-SUMMARY-MEMORY.md](./IMPLEMENTATION-SUMMARY-MEMORY.md) | Implementation | Memory caching implementation |
| [IMPLEMENTATION-COMPLETE.md](./IMPLEMENTATION-COMPLETE.md) | Summary | Complete v2.0 implementation |

---

## 🐛 Troubleshooting & Fixes

| Document | Issue | Description |
|----------|-------|-------------|
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | General | Common issues and solutions |
| [SCHEMA-FIX-SUMMARY.md](./SCHEMA-FIX-SUMMARY.md) | Schema Issues | Custom schema output fixes |
| [CRITICAL-FIX-SCHEMA.md](./CRITICAL-FIX-SCHEMA.md) | Critical Fix | Schema mismatch resolution |
| [PROPERTY-NAME-FIX.md](./PROPERTY-NAME-FIX.md) | Property Names | Inconsistent property fixes |
| [TOOL-ASSIGNMENT-FIX.md](./TOOL-ASSIGNMENT-FIX.md) | Tool Assignment | Tool assignment issues |
| [CLAUDE-DESKTOP-FIX.md](./CLAUDE-DESKTOP-FIX.md) | Claude Desktop | Orchestration card parsing |
| [FIX-SUMMARY.md](./FIX-SUMMARY.md) | Summary | All fixes overview |

---

## 🧪 Testing

| Document | Type | Description |
|----------|------|-------------|
| [test-generation-modes.md](./test-generation-modes.md) | Testing Guide | Test flexible generation modes |
| [TEST-PROMPT-CLAUDE.md](./TEST-PROMPT-CLAUDE.md) | Quick Test | Fast Claude Desktop test |
| [test-comprehensive-prompt.md](./test-comprehensive-prompt.md) | Comprehensive | Full feature test |
| [test-prompts/README.md](./test-prompts/README.md) | Test Suite | Test prompt collection |
| [test-prompts/1-medical-diagnosis-system.md](./test-prompts/1-medical-diagnosis-system.md) | Medical | Medical workflow test |
| [test-prompts/2-fraud-detection-system.md](./test-prompts/2-fraud-detection-system.md) | Fraud | Fraud detection test |
| [test-prompts/3-content-publishing-system.md](./test-prompts/3-content-publishing-system.md) | Content | Publishing workflow test |
| [test-prompts/4-smart-home-automation.md](./test-prompts/4-smart-home-automation.md) | IoT | Smart home test |
| [test-prompts/5-research-literature-review.md](./test-prompts/5-research-literature-review.md) | Research | Literature review test |
| [test-prompts/UPDATED-TEST-PROMPTS.md](./test-prompts/UPDATED-TEST-PROMPTS.md) | Status | Test prompt updates |

---

## 🤝 Contributing

| Document | Topic | Description |
|----------|-------|-------------|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Guidelines | How to contribute |
| [OPEN_SOURCE.md](./OPEN_SOURCE.md) | Open Source | Licensing and usage |

---

## 📊 Documentation Status

### ✅ Up-to-Date (v2.1.0)
- README.md
- RELEASE-NOTES-v2.1.0.md
- All v2.1 feature docs
- package.json
- src/index.ts

### 📝 Legacy (Still Relevant)
- v2.0 feature docs
- Fix summaries
- Architecture docs

### 🗑️ Deprecated
- None currently

---

## 🔍 Quick Navigation

**By Role:**
- **New Users:** Start with [README.md](./README.md)
- **Existing Users:** See [RELEASE-NOTES-v2.1.0.md](./RELEASE-NOTES-v2.1.0.md)
- **Developers:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Integrators:** Review platform-specific setup docs

**By Task:**
- **Installation:** [README.md](./README.md) → Installation section
- **Configuration:** [README.md](./README.md) → Configuration section
- **Using Memory:** [MEMORY-QUICK-START.md](./MEMORY-QUICK-START.md)
- **Custom Systems:** [SYSTEM-CONFIGURABLE-GENERATION.md](./SYSTEM-CONFIGURABLE-GENERATION.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Testing:** [test-prompts/README.md](./test-prompts/README.md)

**By Feature:**
- **Generation Modes:** [GENERATION-MODES.md](./GENERATION-MODES.md)
- **Memory Caching:** [MEMORY-CACHING.md](./MEMORY-CACHING.md)
- **Visualization:** [ENHANCED-VISUALIZATION.md](./ENHANCED-VISUALIZATION.md)
- **Custom Prompts:** [SYSTEM-CONFIGURABLE-GENERATION.md](./SYSTEM-CONFIGURABLE-GENERATION.md)

---

## 📞 Need Help?

1. **Search this index** for relevant documentation
2. **Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for common issues
3. **Review [README.md](./README.md)** for general information
4. **Open an issue** on GitHub if problem persists

---

**Last Updated:** October 4, 2025  
**Documentation Version:** 2.1.0  
**Total Documents:** 35+

---

*All documentation is kept up-to-date with each release.*

