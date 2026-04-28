# obsidian-vault-mcp

MCP server (TypeScript) que conecta **Claude Code** con el **vault de Obsidian del equipo** y los **repos de GitHub de la org**, exponiendo herramientas para notas, memoria de equipo (reuniones, decisiones, action items), análisis de commits y knowledge graph.

Hecho para [DataOilers](https://github.com/data-oilers): single-vault `pandora-refinery` con arquitectura **PARA + LYT Atlas**.

## Quick start (5 minutos)

```bash
# 1. Cloná este repo
git clone https://github.com/data-oilers/obsidian-vault-mcp.git ~/Development_dataoilers/obsidian-vault-mcp
cd ~/Development_dataoilers/obsidian-vault-mcp

# 2. Setup
npm install && npm run build
cp .env.example .env       # editá: GITHUB_TOKEN, GITHUB_ORG, paths del vault y repos

# 3. Registrá el MCP en Claude Code (1 comando)
claude mcp add -s user obsidian-vault-team-context -- node "$(pwd)/dist/index.js"

# 4. Verificá
claude mcp list | grep obsidian   # esperado: ✓ Connected
```

Para el setup completo con scripts automáticos (incluye merge no-destructivo de `~/.claude/CLAUDE.md`, instalación de skills, etc.) ver [`onboarding/README.md`](onboarding/README.md).

## Mapa de la documentación

| Doc | Cuándo leer |
|---|---|
| [`QUICK-START.md`](QUICK-START.md) | Tenés el repo clonado y querés probar el MCP en 5 min. |
| [`INSTALLATION.md`](INSTALLATION.md) | Setup detallado: requisitos, deps, env vars, primer build. |
| [`CONFIGURATION.md`](CONFIGURATION.md) | Configurar paths del vault, GitHub token, registrar en Claude Code. |
| [`VAULT-CONVENTIONS.md`](VAULT-CONVENTIONS.md) | **Convención del vault** — kebab-case, PARA + LYT Atlas, naming, dónde va cada tipo de nota. |
| [`USAGE.md`](USAGE.md) | Referencia completa de las 25+ tools del MCP con parámetros y ejemplos. |
| [`EXAMPLES.md`](EXAMPLES.md) | Casos de uso reales (registrar reunión, query memory, knowledge graph, etc). |
| [`ROADMAP.md`](ROADMAP.md) | Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 (audio) en progreso. |
| [`onboarding/`](onboarding/) | Paquete de setup para miembros nuevos del equipo (scripts + walkthrough). |

## Qué expone el MCP

**25+ tools en 6 categorías:**

- **Obsidian** — `create_note`, `read_note`, `search_notes`, `append_to_note`, `update_note`, `list_subjects`.
- **Git** — `get_repo_context`, `get_file_history`, `get_commit_info`, `get_repo_stats`, `list_repos`.
- **Memory** — `create_meeting_note`, `query_memory`, `get_team_context`, `list_action_items`.
- **Linking** — `auto_link_commits`, `link_commit_to_decision`, `link_action_item_to_commit`, `get_decision_timeline`, `get_decision_impact`, `mark_decision_complete`, `advanced_search`.
- **Knowledge Graph** — `get_knowledge_graph`, `analyze_node_impact`, `find_communities`, `get_node_path`, `get_person_network`, `get_repo_decision_history`.
- **Sync** — `sync_graph_to_obsidian` (genera MOCs auto en `_atlas/people/`, `_atlas/repos/`, `_atlas/team-map.md`).

## Arquitectura (1 línea)

> Single-vault `pandora-refinery` (Obsidian) + el MCP que lo lee/escribe + claude-mem para contexto cross-sesión + GitHub MCP para auth/PRs. Todo lo conecta Claude Code.

## Stack

- TypeScript, [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk), [`@octokit/rest`](https://github.com/octokit/rest.js), Zod
- Audio (Phase 4): `@xenova/transformers` (Whisper local), `chokidar`, `@anthropic-ai/sdk`
- Build: `tsc` directo (sin bundler)

## Convenciones

Ver [`CLAUDE.md`](CLAUDE.md) (instrucciones para Claude trabajando en este repo) y [`VAULT-CONVENTIONS.md`](VAULT-CONVENTIONS.md) (convención del vault).

## Soporte

- Issues / preguntas: GitHub Issues del repo
- Para nuevos miembros del equipo: empezar por [`onboarding/DAY-1-CHECKLIST.md`](onboarding/DAY-1-CHECKLIST.md).
