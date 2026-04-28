# Vault Conventions

Esta es la **convención canónica** del vault `pandora-refinery` del equipo DataOilers. Aplica a todas las notas que el equipo cree, sea a mano o vía el MCP.

> Si vas a crear una nota o decidir dónde poner algo, **leé esta página primero**.

## Principios

1. **kebab-case + lowercase + inglés** en todos los paths. Sin espacios, sin mayúsculas.
2. **PARA + LYT Atlas** — combinamos dos frameworks PKM probados.
3. **Atlas es único nav hub** — todo lo navegacional vive en `_atlas/`.
4. **Plural = auto-gen, singular = curado** dentro de `_atlas/`.
5. **Numeración 2-dígitos** (`01-`, `02-`) en categorías PARA para forzar orden semántico.

## Estructura top-level

```
pandora-refinery/
├── _atlas/                    ← ÚNICO nav hub: MOCs por tema + indices auto-gen
├── _inbox/                    ← captura rápida (procesar y mover en < 1 semana)
├── 01-projects/               ← work activo con deadline (PARA: Projects)
│   ├── itmind-infrastructure/
│   └── enterprise-ai-platform/
├── 02-areas/                  ← responsabilidades ongoing (PARA: Areas)
│   ├── infrastructure/
│   ├── data-engineering/
│   └── security/
├── 03-resources/              ← refs, papers, glosarios (PARA: Resources)
├── 04-archive/                ← inactivos (PARA: Archive)
├── meetings/                  ← MCP: notas de reunión (LYT: Calendar zone)
├── decisions/                 ← MCP: ADRs y decisiones del equipo
├── templates/                 ← templates copiables
├── home.md                    ← landing page del vault
└── README.md
```

## Las 4 zonas (PARA)

PARA es la metodología de Tiago Forte: organizar por **accionabilidad**.

### `01-projects/` — work activo con deadline

Un folder por repo de código que el equipo está manteniendo activamente. Nombre del folder = nombre del repo (kebab-case). Cuando el proyecto se completa o se abandona, se mueve a `04-archive/`.

```
01-projects/itmind-infrastructure/
├── index.md           # overview del proyecto
├── decisions/         # ADRs del proyecto
├── docs/              # docs técnicas (arquitectura, integración, etc)
├── postmortems/       # incidentes y RCAs
├── runbooks/          # comandos / playbooks operativos
└── specs/             # RFCs / diseños de features
```

### `02-areas/` — responsabilidades continuas

Áreas de la operación que existen ongoing, sin deadline definido. Ejemplos: `infrastructure/`, `data-engineering/`, `security/`. Aquí van notas que cruzan múltiples proyectos o que son de la operación general.

### `03-resources/` — referencias

Cosas que **consultás** pero que no son responsabilidad tuya: papers, glosarios, docs externas anotadas, cheatsheets, links útiles. Si la categoría tiene mucho material, hacé una MOC en `_atlas/moc-<tema>.md`.

### `04-archive/` — inactivos

Proyectos completados o áreas que dejaron de ser relevantes. **Mover acá en vez de borrar** — preserva el contexto histórico y los wikilinks no se rompen.

## Atlas (LYT)

LYT (Linking Your Thinking, de Nick Milo) postula un único hub de navegación en `_atlas/`.

### Reglas en `_atlas/`

```
_atlas/
├── moc-airflow.md              # MOC por TEMA — links a notas de Airflow
├── moc-clickhouse.md
├── moc-gke.md
├── ...
├── people-overview.md          # narrativa curada (singular = curado a mano)
├── technologies-overview.md
├── team-map.md                 # MCP: Mermaid del knowledge graph
├── people/                     # MCP: 1 MOC auto-gen por persona (plural = auto-gen)
│   ├── franco.md
│   └── lautaro.md
└── repos/                      # MCP: 1 MOC auto-gen por repo
    └── itmind-infrastructure.md
```

**Convención singular vs plural:**
- `people-overview.md` (singular) → narrativa curada a mano sobre el equipo.
- `people/` (plural) → carpeta auto-generada por el MCP, una nota por persona.

Esta regla evita conflictos cuando agregamos nuevos tipos (`tools/`, `clients/`, etc): siempre el folder plural es auto-gen, el archivo singular es curado.

### Qué es una MOC (Map of Content)

Una nota cuyo único propósito es **linkear a otras notas** de un tema. No tiene contenido propio. Ejemplo:

```markdown
# MOC: Airflow

Todas las notas relacionadas con Airflow:

## Decisiones
- [[2026-03-15-migrar-a-airflow-3]]
- [[2026-04-01-conector-clickhouse]]

## Postmortems
- [[2026-02-10-pipeline-falló-prod]]

## Specs
- [[01-projects/itmind-infrastructure/specs/airflow-3-migration|airflow-3-migration]]
```

Es una **tabla de contenidos viva** para el tema.

## Naming

### Carpetas

- **kebab-case lowercase**: `data-engineering/`, no `Data Engineering/` ni `dataEngineering/`.
- **Plural** para categorías: `decisions/`, `meetings/`, `specs/` — no `decision/`, `meeting/`.
- **Numeración 2-dígitos**: `01-projects/`, `02-areas/`. Razón: ordenamiento alfabético en file managers (`02` < `10`, pero `2` > `10`).

### Archivos `.md`

- **Slug en kebab-case**: `migracion-postgres-16.md`, `q-30-bootstrap-secrets.md`.
- **Para meetings**: `YYYY-MM-DD-slug.md` (el MCP los crea así automáticamente).
- **Para decisions/postmortems**: `YYYY-MM-DD-slug.md` recomendado.

### Brand names

Preservar grafía del producto si es de una palabra: `clickhouse` (no `click-house`), `langfuse`, `airflow`, `gke`. Si el producto es multipalabra: `secret-manager` (de "Google Secret Manager").

## Frontmatter

Todo `.md` arranca con frontmatter YAML:

```yaml
---
tags: [spec, infrastructure, security]   # tags para Dataview / búsqueda
fecha: 2026-04-23                        # ISO date
estado: in-progress                      # in-progress | completado | deprecated | draft
autor: nombre.apellido                   # tu git username
proyecto: "[[01-projects/itmind-infrastructure/index|itmind-infrastructure]]"
relacionado:                             # wikilinks opcionales
  - "[[V-02]]"
  - "[[Q-V-03]]"
---
```

## Wikilinks

- **Shortform** cuando el filename es único en el vault: `[[V-02]]`, `[[Q-27]]`.
- **Path completo** cuando hay ambigüedad o querés ser explícito: `[[01-projects/itmind-infrastructure/specs/V-02]]`.
- **Display alias** para legibilidad: `[[01-projects/itmind-infrastructure/index|itmind-infrastructure]]`.
- **Links a código**: URL completa a GitHub.

## Callouts

Usar para resaltar info crítica:

```markdown
> [!info] Metadata
> Fecha: 2026-04-23
> Owner: Lautaro

> [!warning] Gotcha
> El REMOTE_LOG_CONN_ID no debe estar seteado cuando Airflow usa ADC.

> [!danger] Acción urgente
> F-02 requiere scale-down antes del deploy.

> [!success] Validado
> Smoke tests OK en QA.

> [!note] Nota
> Pendiente confirmar con @franco
```

## Decision tree: dónde va una nota nueva

```
¿La nota es sobre un repo de código específico?
├── SÍ → 01-projects/<repo-name>/<subcarpeta>/
│   ├── ADR / decisión arquitectónica → decisions/
│   ├── RFC / spec de feature → specs/
│   ├── Postmortem de incidente → postmortems/
│   ├── Comandos / playbook operativo → runbooks/
│   └── Doc técnica general → docs/
│
└── NO → ¿Es una decisión transversal del equipo?
    ├── SÍ → decisions/ (top-level)
    │
    └── NO → ¿Es una reunión?
        ├── SÍ → meetings/ (top-level, lo crea create_meeting_note)
        │
        └── NO → ¿Es una responsabilidad ongoing del área?
            ├── SÍ → 02-areas/<área>/
            │
            └── NO → ¿Es referencia externa (paper, doc de terceros)?
                ├── SÍ → 03-resources/
                │
                └── NO → ¿Es captura rápida sin clasificar?
                    ├── SÍ → _inbox/ (procesalo en < 1 semana)
                    │
                    └── NO → ¿Es un MOC / índice navegacional?
                        └── SÍ → _atlas/moc-<tema>.md
```

## Cuándo mover a `04-archive/`

- Proyecto completado: el repo de código se archivó o se freezeó.
- Decisión deprecada: ya no aplica, pero querés preservar el por qué.
- Spec abandonada: la dirección cambió y la nota ya no es relevante.

**Nunca borres** — los wikilinks rompen y se pierde contexto histórico.

## Auto-generación por el MCP

El MCP `obsidian-vault-mcp` escribe en estos paths:

| Tool | Path destino |
|---|---|
| `create_meeting_note` | `meetings/YYYY-MM-DD-<slug>.md` |
| `sync_graph_to_obsidian` (people) | `_atlas/people/<nombre>.md` |
| `sync_graph_to_obsidian` (repos) | `_atlas/repos/<repo>.md` |
| `sync_graph_to_obsidian` (decisions) | `decisions/<slug>.md` |
| `sync_graph_to_obsidian` (team map) | `_atlas/team-map.md` |

Estos paths están hardcoded en `src/tools/`. Si querés cambiarlos, editá ahí + actualizá esta convención.

## Referencias

- [PARA Method (Tiago Forte)](https://fortelabs.com/blog/para/) — Projects/Areas/Resources/Archive
- [LYT (Nick Milo)](https://www.linkingyourthinking.com/) — Atlas, MOCs, Linked Thinking
- [Obsidian forum: How to Structure Notes](https://forum.obsidian.md/t/how-to-structure-notes-categories-tags-and-folders/103125)
- [Steph Ango: How I use Obsidian](https://stephango.com/vault)
