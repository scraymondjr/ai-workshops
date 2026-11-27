# Google ADK track

Do this second, in Python. The design records ADK Python 2.15.1, TypeScript 2.5.0, and Go v2.8.0 on 26 Nov 2026.

`adk eval` and Ollama via LiteLLM are documented for Python only. Use them beside the shared harness, not instead of it.

- Tools: `McpToolset` against the Fernhill servers.
- Memory: `InMemoryMemoryService` is lost on restart. Vertex AI Memory Bank is a paid Google Cloud service. For $0, write a SQLite `MemoryService`.
- Multi-agent: ADK 2.0 graph and dynamic workflows.
- The design's security note: compromised LiteLLM versions 1.82.7 and 1.82.8 were published to PyPI in March 2026. Pin a current ADK.

ADK Go's OpenAI-compatible models were experimental in the design. Leave that track until it isn't.
