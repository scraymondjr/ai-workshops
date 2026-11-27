# Claude Desktop track

No-code. Same Fernhill files, scored with rubrics instead of the harness.

The design's kit:

- Knowledge files: `shared/fernhill/seed/kb.md` and `halcyon.md`
- A desktop extension, not a custom connector. Custom connectors are reached from Anthropic's cloud and need a public HTTPS server. Desktop extensions run locally over stdio.
- `advance_clock` plus mock tools. Refund and email are dry-run and only log.
- A grader project: rubric in the project instructions, then the scoring prompt in `scoring-prompt.md`

`manifest.json` in this folder is a sketch of that extension. It is not a packaged `fernhill.mcpb`, and it was not installed into Claude Desktop from this environment. Packaging the extension is the open prep task in the design.

Projects on the free plan: up to 5. On paid plans, RAG mode turns on when knowledge nears the context limit. Memory is on by default. Turn off "Use account memory" when a module says to. Skills need Pro or higher. Claude Pro was $20/month ($17 annual) in the design. Pro includes no API credits.

Each module page has the Claude exercise and the rubric under the Claude Desktop tab.
