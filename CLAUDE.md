# Obsidian Vault MCP Server

## Qué es

MCP server en TypeScript que expone herramientas para gestionar vaults de Obsidian desde Claude Code. Permite crear, leer, buscar, actualizar y agregar contenido a notas.

## Setup

```bash
npm install
npm run build
node dist/index.js
```

Registrar en la config de Claude Code apuntando a `dist/index.js` como MCP server stdio.

## Configuración de vaults

Editar `src/config.ts` para configurar:
- `VAULTS`: Record con nombre, path en disco, y flag de git
- `SUBJECT_TAGS`: Mapeo de nombres de materia/tema a slugs para tags

Las rutas son absolutas desde el home del usuario. Al clonar en otra máquina, actualizar los paths.

## Tools disponibles

### Obsidian
- `create_note` — Crea nota con templates estructurados
- `read_note` — Lee contenido de una nota
- `search_notes` — Busca en la vault con grep
- `append_to_note` — Agrega contenido a una nota (puede apuntar a sección específica)
- `update_note` — Reescribe completamente una nota
- `list_subjects` — Lista la estructura de carpetas/materias de una vault

### Git (Fase 1)
- `get_repo_context` — Contexto reciente de un repo
- `get_file_history` — Historial de un archivo
- `get_commit_info` — Info de un commit
- `get_repo_stats` — Stats por autor
- `list_repos` — Lista repos trackeados

### Memory (Fase 1)
- `create_meeting_note` — Nota de reunion con persistencia en Memory
- `query_memory` — Buscar en Memory
- `get_team_context` — Snapshot del equipo
- `list_action_items` — Items de accion pendientes

### Linking (Fase 2)
- `auto_link_commits` — Auto-linking commits a decisiones
- `link_commit_to_decision` — Link manual
- `link_action_item_to_commit` — Asociar action item con commit
- `get_decision_timeline` — Timeline de una decision
- `get_decision_impact` — Impacto de una decision
- `mark_decision_complete` — Marcar decision completada
- `advanced_search` — Busqueda avanzada con filtros

### Knowledge Graph (Fase 3)
- `get_knowledge_graph` — Exportar grafo (Mermaid/JSON)
- `analyze_node_impact` — Analisis de impacto de un nodo
- `find_communities` — Detectar clusters
- `get_node_path` — Camino mas corto entre nodos
- `get_person_network` — Network de una persona
- `get_repo_decision_history` — Decisiones que afectaron un repo
- `sync_graph_to_obsidian` — Sincronizar grafo a Obsidian


## Stack

- TypeScript, MCP SDK (`@modelcontextprotocol/sdk`), Zod
- Audio: `@xenova/transformers` (Whisper), `chokidar`, `@anthropic-ai/sdk`
- Build: `tsc` directo
