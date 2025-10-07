# Visualization Quick Start 🚀

## TL;DR

After generating an intent graph, visualize it with:

```
Use visualize_graph on the intent graph
```

That's it! You'll get a **color-coded, tool-annotated diagram** with modern shapes.

---

## Style Options

### 🔹 Basic (Minimal)
```
Visualize with style 'basic'
```
**Shows:** Agent names + node types only

### 🔸 Detailed (Default - Recommended)
```
Use visualize_graph
```
**Shows:** Names + tools + short instructions + purposes

### 🔶 Complete (Everything)
```
Visualize with style 'complete'
```
**Shows:** Everything including edge conditions

---

## Color Guide

| Color | Node Type |
|-------|-----------|
| 🟢 **Green** | Entry/Start |
| 🔴 **Red** | Exit/End |
| 🔵 **Blue** | Processing |
| 🟠 **Orange** | Decision |
| 🟣 **Purple** | Aggregation |
| 🟢 **Teal** | Parallel |

---

## Example Workflow

**Step 1:** Generate graph
```
Generate an intent graph for customer support ticket processing
```

**Step 2:** Visualize with tools and instructions
```
Use visualize_graph on the intent graph
```

**Step 3:** View the result
- Colored nodes by type
- Tools shown with 📡 (MCP) and ⚙️ (external)
- Brief instructions
- Clear execution flow

---

## Advanced Options

**Left-to-right layout:**
```
Visualize with direction 'LR'
```

**Show conditions on edges:**
```
Visualize with include_conditions true
```

**Hide tools:**
```
Visualize with include_tools false
```

**Show graph metrics:**
```
Visualize with include_metadata true
```

---

## What You'll See

### Node Example:
```
┌─────────────────────────────────┐
│ PaymentProcessor                │ 🔵 Blue box
│ Process payment for order       │
│ ───────────────────────────     │
│ 🔧 Tools:                       │
│ 📡 payment-gateway-mcp/         │
│    authorize_card               │
│ 📡 payment-gateway-mcp/         │
│    charge_card_immediately      │
│ ───────────────────────────     │
│ 📋 For orders >$500, use        │
│    authorization-capture flow.. │
└─────────────────────────────────┘
```

### Edge Types:
- `---->` Sequential
- `-.->` Parallel
- `===>` Conditional
- Labels show edge type and conditions

---

## Tips

✅ **Do:** Use `detailed` style for day-to-day work
✅ **Do:** Use `complete` when debugging
✅ **Do:** Use `LR` direction for wide workflows
❌ **Don't:** Use `basic` unless you need a clean overview

---

## Troubleshooting

**Q: Diagram looks cluttered?**
**A:** Use `style: 'basic'` or `include_instructions: false`

**Q: Can't see tool assignments?**
**A:** Ensure `include_tools: true` (it's the default)

**Q: Need to see edge conditions?**
**A:** Use `include_conditions: true` or `style: 'complete'`

**Q: Diagram too tall?**
**A:** Use `direction: 'LR'` for horizontal layout

---

## Ready to Try!

1. **Restart Claude Desktop** (to load new features)
2. **Generate your graph**
3. **Visualize it**: `Use visualize_graph`
4. **Enjoy the colors!** 🎨

That's it! 🎉


