# Documentation Consolidation Plan (2025-09-13)

This repo has multiple overlapping root docs:

- `README.md` — marketing/overview, claims and examples
- `AGENTS.md` — Codex/MCP agent configuration and workflows
- `GEMINI.md` — Gemini Code Assist MCP integration hub
- `gemini-flow.md` — Comprehensive Google Services integration guide
- `CLAUDE.md` — Claude-centric guidance

Planned consolidation (non-destructive):

- Single entrypoint: update `README.md` to link to sections in `docs/`.
- Move long-form guides into `docs/guides/`:
  - `GEMINI.md` → `docs/guides/gemini-code-assist.md`
  - `gemini-flow.md` → `docs/guides/google-services-integration.md`
  - `CLAUDE.md` → `docs/guides/claude-integration.md`
- Keep `AGENTS.md` at root (operational config), but add short index in `docs/agents/`.
- Archive `*.backup` files into `archive/<date>/`.

Notes:
- `GEMINI.md.backup` is large; recommended to move to `archive/2025-09-13/` during a non‑patch step to avoid huge diffs.
- No content changes performed yet; this is a tracking file.

