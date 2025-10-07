# Contributing to intent-graph MCP Server

First off, thank you for considering contributing to IntentGraph MCP Server! 🎉

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great together.

## How Can I Contribute?

### Reporting Bugs

**Before submitting a bug report:**
- Check if the bug has already been reported in the issues
- Make sure you're using the latest version
- Collect information about the bug (error messages, logs, steps to reproduce)

**When submitting a bug report, include:**
- A clear and descriptive title
- Detailed steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (OS, Node.js version, etc.)
- Relevant logs or screenshots

### Suggesting Enhancements

**Before submitting an enhancement:**
- Check if it's already been suggested
- Consider if it aligns with the project's goals

**When suggesting an enhancement:**
- Use a clear and descriptive title
- Provide a detailed description of the proposed feature
- Explain why this enhancement would be useful
- Include examples of how it would work

### Pull Requests

**Before submitting a pull request:**
1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests as needed
5. Ensure all tests pass (`npm test`)
6. Update documentation if needed
7. Commit your changes with clear messages
8. Push to your fork
9. Open a pull request

**Pull request guidelines:**
- Follow the existing code style
- Write clear, descriptive commit messages
- Include tests for new features
- Update documentation as needed
- Keep PRs focused (one feature/fix per PR)
- Reference any related issues

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/intent-graph-generator.git
cd intent-graph-generator

# Install dependencies
npm install

# Build the project
npm run build

# Set up LLM API key for testing (choose your provider)
export LLM_API_KEY="your-api-key"
export LLM_MODEL="palmyra-x5"  # or claude-3-5-sonnet-20241022, gpt-4, etc.
export LLM_BASE_URL="https://api.writer.com"

# Or use legacy/provider-specific variables (fallback)
export WRITER_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"

# Run tests
npm test

# Make your changes
# ... edit files in src/ ...

# Rebuild
npm run build

# Test your changes
npm test

# Run the server locally
npm start
```

## Code Style

- **TypeScript:** Strict mode, no `any` types
- **ES Modules:** Use explicit `.js` extensions in imports
- **Formatting:** Follow existing code style
- **Comments:** Use JSDoc for public APIs
- **Error Handling:** Always handle errors, never fail silently
- **Logging:** Use `console.error` for debug info (stderr)

## Testing

- Write tests for new features
- Ensure all existing tests pass
- Aim for high code coverage
- Test both success and error cases

**V2.0 Architecture:**
- Primary tool: `generate_intent_graph` (LLM-powered)
- Helper tools: `validate_graph`, `analyze_graph`, `optimize_graph`, `export_graph`, `visualize_graph`, `generate_artifacts`
- All tests in `src/test-v2.ts`

**Test structure:**
```typescript
await runTest('tool_name: scenario', async () => {
  // Arrange
  const input = { orchestration_card: { /* ... */ }, options: { /* ... */ } };
  
  // Act
  const result = await generateIntentGraphTool(input);
  
  // Assert
  assert(result.success === true, 'Should succeed');
  if (!result.success) return;
  
  assert(result.result.intent_graph !== undefined, 'Should return graph');
  assert(result.result.intent_graph.nodes.length > 0, 'Should have nodes');
});
```

**Running Tests:**
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With specific LLM provider
LLM_API_KEY="your-key" LLM_MODEL="gpt-4" npm test
```

## Documentation

- Update README.md if adding new features
- Add JSDoc comments to new functions
- Update TESTING.md for new tests
- Include examples for new tools

## Commit Messages

Use clear, descriptive commit messages:

**Good:**
```
Add support for graph versioning
Fix validation error for parallel edges
Update documentation for export_graph tool
```

**Bad:**
```
Update
Fix bug
Changes
```

## Questions?

Feel free to open an issue for:
- Questions about the codebase
- Help with contribution setup
- Clarification on project direction

## Recognition

Contributors will be acknowledged in:
- The README.md Contributors section
- Release notes for significant contributions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to IntentGraph MCP Server!** 🚀

Your contributions help make this tool better for everyone in the MCP ecosystem.

---

**Contact:** Sean Poyner <sean.poyner@pm.me>

