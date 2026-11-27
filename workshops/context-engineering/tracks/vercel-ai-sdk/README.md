# Vercel AI SDK track

Do this track first. It is TypeScript, like the harness, and the design's defaults run on Workers AI and Ollama at $0.

Recorded in the design on 26 Nov 2026, not re-checked here: `ai` 7.0.183 and `@ai-sdk/mcp` 2.0.106.

- Agent: `ToolLoopAgent`. MCP over HTTP via `@ai-sdk/mcp`.
- Models: `workers-ai-provider` or the Ollama provider.
- Tests: `MockLanguageModelV4` and `MockEmbeddingModelV4` from `ai/test`.
- The SDK does not give you fact freshness, conflict resolution, a handoff schema, or an eval framework. That is the course. The shared harness is the eval layer.

Plug the agent into the stdio adapter in `starters/ts` or serve `POST /turn` and run:

```bash
pnpm ws eval --module m0 --agent "node starters/ts/dist/agent.js"
```
