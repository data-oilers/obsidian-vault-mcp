# Guía de uso — obsidian-vault-mcp

MCP server que conecta Claude Code con tus vaults de Obsidian y tus repos de GitHub, exponiendo herramientas para notas, memoria de equipo y análisis del grafo de conocimiento.

---

## Índice

1. [Setup](#setup)
2. [Configuración](#configuración)
3. [Vault — Notas básicas](#vault--notas-básicas)
4. [Reuniones](#reuniones)
5. [Git](#git)
6. [Memoria del equipo](#memoria-del-equipo)
7. [Auto-linking decisiones ↔ commits](#auto-linking-decisiones--commits)
8. [Búsqueda avanzada](#búsqueda-avanzada)
9. [Grafo de conocimiento](#grafo-de-conocimiento)
10. [Sincronizar a Obsidian](#sincronizar-a-obsidian)
11. [Vaults y repos disponibles](#vaults-y-repos-disponibles)

---

## Setup

```bash
# 1. Instalar dependencias y compilar
npm install
npm run build

# 2. Registrar en Claude Code (claude_desktop_config.json o settings.json)
{
  "mcpServers": {
    "obsidian-vault-team-context": {
      "command": "node",
      "args": ["/ruta/absoluta/a/obsidian-vault-mcp/dist/index.js"]
    }
  }
}
```

Variables de entorno opcionales (para el token de GitHub):

```bash
GITHUB_TOKEN=ghp_...
GITHUB_ORG=data-oilers
```

---

## Configuración

Editar `src/config.ts`:

| Sección | Qué configura |
|---------|---------------|
| `VAULTS` | Nombre, path absoluto y flag `hasGit` de cada vault |
| `REPOS` | Repos locales con nombre, URL y path en disco |
| `TEAM_MEMBERS` | Nombre, email y rol de cada integrante |
| `SUBJECT_TAGS` | Mapeo materia → slug de tag |

Después de editar: `npm run build`.

---

## Vault — Notas básicas

### `create_note`

Crea una nota nueva con un template estructurado.

```
vault: "DATAOILERS"
title: string
content: string
subject?: string          # opcional: subcarpeta donde crear la nota (ej: "infrastructure", "data-engineering")
type?: "general" | "clase" | "concepto" | "ejercicio"

# Campos opcionales según type:
key_concepts?, definition?, examples?, problem?, solution?,
notes?, context?, references?
```

> No sobreescribe un archivo existente. Usar `append_to_note` o `update_note` en ese caso.

> [!note] Nota sobre `subject`
> El parámetro `subject` viene de la versión académica del MCP (vault FACULTAD). En el vault del equipo (DATAOILERS / pandora-refinery) la organización es por carpetas PARA (`01-projects/`, `02-areas/`, etc), no por subject. Si querés escribir en un path específico, usá `Write` directo o pasá el path completo en `title` (ej: `title: "01-projects/itmind-infrastructure/specs/Q-40-nueva-feature.md"`).

### `read_note`

Lee el contenido de una nota.

```
vault: "DATAOILERS"
title: "Q-40-nueva-feature"   # busca en todo el vault
```

### `search_notes`

Busca texto en la vault (usa grep internamente).

```
vault: "DATAOILERS"
query: "workload identity"
subject?: "01-projects"   # opcional: restringe a esa subcarpeta
```

### `append_to_note`

Agrega contenido al final de una nota (o a una sección específica).

```
vault: "DATAOILERS"
title: "Q-40-nueva-feature"
content: "## Validación\n\nSmoke tests OK en QA..."
section?: "## Implementación"   # inserta justo después de esa sección
```

### `update_note`

Reescribe la nota completa.

```
vault: "DATAOILERS"
title: "01-projects/itmind-infrastructure/runbooks/deploy-qa"
content: "# Deploy QA\n\n..."
```

### `list_subjects`

Lista la estructura top-level de carpetas del vault.

```
vault: "DATAOILERS"
```

> Devuelve los folders de primer nivel: `_atlas`, `01-projects`, `02-areas`, `03-resources`, `04-archive`, `meetings`, `decisions`, `templates`, etc.

---

## Reuniones

### `create_meeting_note`

Crea una nota estructurada de reunión y la persiste automáticamente en Memory.

```
vault: "DATAOILERS"
date: "2026-04-15"
title: "Sprint Planning Q2"
participants: ["Eliezer", "Franco", "Gaston"]
decisions: [
  "Usar arquitectura microservicios para el módulo de ingesta",
  "Migrar a Postgres 16 antes de fin de mes"
]
actionItems: [
  { task: "Crear diagrama de arquitectura", owner: "Eliezer", dueDate: "2026-04-22" },
  { task: "Actualizar changelog de DB", owner: "Gaston", dueDate: "2026-04-30" }
]
summary?: "Definimos el roadmap técnico para Q2..."
relatedRepos?: ["enterprise-ai-platform"]
```

Guarda en el vault en `meetings/YYYY-MM-DD-slug.md` y retorna los IDs de decisiones y action items creados en Memory.

Participantes válidos: `Emiliano`, `Emanuel`, `Agustin`, `Lautaro`, `Franco`, `Branco`, `Gaston`, `Eliezer`.

---

## Git

### `list_repos`

Lista todos los repos registrados en `config.ts`.

```
(sin parámetros)
```

### `get_repo_context`

Retorna commits recientes, rama actual y estadísticas del repo.

```
repo: "enterprise-ai-platform"
limit?: 20
```

### `get_file_history`

Historial de commits de un archivo específico.

```
repo: "itmind-infrastructure"
filePath: "src/models/riesgo.py"
limit?: 20
```

### `get_commit_info`

Info detallada de un commit (archivos tocados, diff, autor, mensaje).

```
repo: "enterprise-ai-platform"
hash: "abc1234"        # también acepta HEAD, HEAD~2, etc.
```

### `get_repo_stats`

Commits por autor en el último mes (o semana).

```
repo: "enterprise-ai-platform"
timeframe?: "month" | "week"
```

---

## Memoria del equipo

Los datos de reuniones, decisiones y action items se guardan automáticamente al llamar a `create_meeting_note`. Estas herramientas permiten consultarlos.

### `query_memory`

Búsqueda de texto libre con filtros opcionales.

```
query: "arquitectura microservicios"
type?: "meeting" | "decision" | "action-item" | "context"
author?: "Eliezer"
from?: "2026-01-01"
to?: "2026-04-15"
repos?: ["enterprise-ai-platform"]
```

### `get_team_context`

Snapshot del contexto del equipo: reuniones, decisiones y action items del período.

```
timeframe: "week" | "month"
```

### `list_action_items`

Lista action items con filtros de propietario y estado.

```
owner?: "Franco"
status?: "pending" | "in-progress" | "completed"
```

---

## Auto-linking decisiones ↔ commits

Conecta decisiones de Memory con los commits que las implementan.

### `auto_link_commits`

Escanea commits de uno o más repos y crea links automáticos con una decisión basándose en scoring de relevancia.

```
decisionId: "decision-abc123"          # ID retornado por create_meeting_note
repos?: ["enterprise-ai-platform"]    # default: todos los repos relacionados
timeframeAfterDecision?: 30            # días hacia adelante para buscar
confidenceThreshold?: 0.7              # umbral mínimo (0-1)
```

### `link_commit_to_decision`

Link manual (confianza 1.0).

```
repo: "enterprise-ai-platform"
commitHash: "abc1234"
decisionId: "decision-abc123"
linkType?: "implements" | "fixes" | "refactors" | "related"
```

### `link_action_item_to_commit`

Asocia un action item con el commit que lo resuelve (pasa el item a `in-progress`).

```
actionItemId: "action-item-xyz"
commitHash: "def5678"
repo: "enterprise-ai-platform"
```

### `get_decision_timeline`

Cronología completa de una decisión: la decisión en sí, sus action items y los commits vinculados.

```
decisionId: "decision-abc123"
```

### `get_decision_impact`

Repos, autores y archivos afectados por los commits de una decisión.

```
decisionId: "decision-abc123"
```

### `mark_decision_complete`

Marca una decisión como completada.

```
decisionId: "decision-abc123"
completionDate?: "2026-04-20"    # default: hoy
```

---

## Búsqueda avanzada

### `advanced_search`

Búsqueda con scoring de relevancia, boost de recencia y filtros combinados.

```
query: "migración postgres"
types?: ["decision", "action-item"]
authors?: ["Eliezer", "Gaston"]
from?: "2026-03-01"
to?: "2026-04-15"
repos?: ["enterprise-ai-platform"]
tags?: ["infra"]
status?: "open" | "in-progress" | "completed"
linkedToCommit?: true          # solo entradas con commits linkeados
confidenceMin?: 0.8
sort?: "relevance" | "date" | "confidence"
limit?: 20
```

---

## Grafo de conocimiento

Construye un grafo en memoria que conecta personas, decisiones, meetings, commits, repos y tópicos.

### `get_knowledge_graph`

Retorna el grafo en formato Mermaid (por defecto) o JSON.

```
timeframe?: "week" | "month" | "all"
nodeTypes?: ["decision", "meeting", "action-item", "commit", "person", "repo", "topic"]
minImportance?: 0.3          # filtra nodos poco conectados
repos?: ["enterprise-ai-platform"]
people?: ["Eliezer"]
format?: "mermaid" | "json"
```

### `analyze_node_impact`

BFS desde un nodo para medir su alcance (repos afectados, personas involucradas).

```
nodeId: "decision-abc123"    # acepta búsqueda parcial por label
depth?: 3                     # profundidad máxima del BFS (1-5)
```

### `find_communities`

Detecta grupos de nodos densamente conectados.

```
minSize?: 2
```

### `get_node_path`

Camino más corto entre dos nodos y cuellos de botella en la ruta.

```
from: "Eliezer"                          # ID o texto parcial
to: "enterprise-ai-platform"
```

### `get_person_network`

Red de una persona: meetings, decisiones, repos, commits y colaboradores.

```
person: "Eliezer"
depth?: 2
```

### `get_repo_decision_history`

Historial de decisiones que impactaron en un repo, ordenado cronológicamente.

```
repo: "enterprise-ai-platform"
```

---

## Sincronizar a Obsidian

### `sync_graph_to_obsidian`

Genera (o sobreescribe) notas en el vault a partir del grafo y Memory:

- `_atlas/people/<nombre>.md` — reuniones, decisiones y action items por persona
- `_atlas/repos/<repo>.md` — decisiones y contribuidores por repo
- `decisions/<slug>.md` — detalle de cada decisión con commits linkeados
- `_atlas/team-map.md` — MOC con diagrama Mermaid embebido

```
vault: "DATAOILERS"
```

Luego abrir el vault en Obsidian → Graph View (`Ctrl+G`) para ver las conexiones visuales.

---

## Vaults y repos disponibles

Paths default (cross-platform, basados en `homedir()`). Override via env vars `VAULTS_<NAME>_PATH` y `REPO_<NAME>_PATH`.

| Vault | Path default | Git |
|-------|--------------|-----|
| `DATAOILERS` | `~/Documentos/DATAOILERS` | sí |
| `DATAOILERS` | `~/Documentos/DATAOILERS` | no |
| `DATAOILERS` | `~/Documentos/DATAOILERS` | no |

| Repo | Org | Path local default |
|------|-----|--------------------|
| `enterprise-ai-platform` | data-oilers | `~/repos/data-oilers/enterprise-ai-platform` |
| `itmind-infrastructure` | data-oilers | `~/repos/data-oilers/itmind-infrastructure` |

> En Windows, `~` se expande a `C:\Users\<usuario>` (via `os.homedir()`).

Para agregar repos: editar `REPOS` en `src/config.ts` y recompilar.
