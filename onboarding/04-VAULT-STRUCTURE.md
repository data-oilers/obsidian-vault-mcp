# 04 — Estructura del Vault del Equipo

## Modelo: single-vault

Usamos **un único vault de Obsidian** para todo el equipo, llamado **`pandora-refinery`**, sincronizado vía git privado.

```
pandora-refinery/  (git repo privado en la org data-oilers)
├── .obsidian/             # config de Obsidian (versionada para que todos vean igual)
├── _atlas/                # ÚNICO nav hub (MOCs, indices, mapas)
├── _inbox/                # captura rápida (procesar y mover)
├── 01-projects/           # work activo con deadline
│   ├── itmind-infrastructure/
│   └── enterprise-ai-platform/   ← cuando se sume
├── 02-areas/              # responsabilidades ongoing
│   ├── infrastructure/
│   ├── data-engineering/
│   └── security/
├── 03-resources/          # refs, papers, glosarios, docs externas
├── 04-archive/            # inactivos
├── meetings/              # MCP: notas de reunión (time-based)
├── decisions/             # MCP: ADRs y decisiones del equipo
├── templates/             # templates copiables (decision-adr.md, spec.md, etc)
├── home.md                # landing page del vault
└── README.md
```

> [!info] Convención de naming
> **kebab-case + lowercase + inglés** en todos los paths. Sin espacios ni mayúsculas. Plurales para categorías. Ver [VAULT-CONVENTIONS.md](../VAULT-CONVENTIONS.md) para la guía completa.

## Por qué single-vault (y no multi-vault con submodules)

Discutimos arquitectura multi-vault (un repo `dataoilers-vault-<repo>` por cada repo de código, agrupados con git submodules). La descartamos por ahora:

- **Fricción de submodules** alta vs. el beneficio (la mayoría del equipo trabaja transversalmente).
- **Single-vault permite wikilinks libres** entre cualquier área sin pensar en cross-repo.
- **Permisos** los manejamos a nivel del repo `pandora-refinery` completo. Si en el futuro necesitamos permisos granulares por área, migramos.
- **El MCP fue diseñado** para un solo path de vault por nombre canónico (`DATAOILERS` → `pandora-refinery`).

Si más adelante queremos separar (ej. cliente que quiere ver solo "su" área), ahí evaluamos multi-vault. Por ahora KISS.

## Las zonas (PARA + LYT Atlas)

Combinamos dos frameworks PKM bien establecidos:

- **PARA** (Tiago Forte): organizar por *accionabilidad* — Projects (con deadline), Areas (ongoing), Resources (refs), Archive (frío).
- **LYT Atlas** (Nick Milo): la nav del vault vive en un único hub `_atlas/` con MOCs (Maps of Content).

### `_atlas/` — el nav hub

Todo lo que sirve para *navegar el vault* vive acá. No tiene contenido propio, solo links.

```
_atlas/
├── moc-airflow.md              # MOC por TEMA — links a notas de Airflow
├── moc-clickhouse.md
├── moc-gke.md
├── ...
├── people-overview.md          # narrativa curada del equipo (singular)
├── technologies-overview.md
├── team-map.md                 # MCP: Mermaid del knowledge graph
├── people/                     # MCP: 1 MOC auto-gen por persona (plural)
│   ├── franco.md
│   └── lautaro.md
└── repos/                      # MCP: 1 MOC auto-gen por repo
    └── itmind-infrastructure.md
```

**Regla `_atlas/`**: archivo singular = curado a mano (`people-overview.md`); folder plural = auto-generado por el MCP (`people/`).

### `01-projects/` — work activo con deadline

Un folder por repo de código que el equipo está manteniendo activamente. Nombre del folder = nombre del repo (kebab-case lowercase).

```
01-projects/itmind-infrastructure/
├── index.md
├── decisions/                  # ADRs del proyecto
├── docs/                       # docs técnicas
├── postmortems/                # incidentes
├── runbooks/                   # comandos / playbooks
└── specs/                      # RFCs, diseños
```

> Las subcarpetas dentro de un proyecto siguen la misma convención: kebab-case lowercase plural.

### `02-areas/` — responsabilidades continuas

Áreas de la operación que existen ongoing, sin deadline. Hoy: `infrastructure/`, `data-engineering/`, `security/`. Cuando empiezan vacías arranca un `.gitkeep`.

### `03-resources/` — referencias

Papers, glosarios, docs externas anotadas, cheatsheets. Cosas que consultás pero no son tuyas.

### `04-archive/` — inactivos

Proyectos completados o áreas que dejaron de ser relevantes. Mover acá en vez de borrar.

### `meetings/` y `decisions/` — auto-generados time-based

Estas dos están a la **raíz** (no dentro de `_atlas/` ni `01-projects/`) porque son **time-based**: las reuniones tienen fecha y se acumulan cronológicamente, las decisiones idem. En LYT esto es la "Calendar zone".

Las crea el MCP automáticamente vía `create_meeting_note` y `sync_graph_to_obsidian`. Ver [`USAGE.md`](../USAGE.md) para detalles.

## Convenciones de archivos

### Frontmatter estándar

Todo archivo markdown arranca con:

```yaml
---
tags: [spec, infrastructure, security]   # tags para búsqueda y dataview
fecha: 2026-04-23                        # fecha ISO
estado: in-progress                      # in-progress | completado | deprecated | draft
autor: nombre.apellido                   # tu usuario git
proyecto: "[[01-projects/itmind-infrastructure/index|itmind-infrastructure]]"
relacionado:                             # wikilinks opcionales
  - "[[V-02]]"
  - "[[Q-V-03]]"
---
```

### Wikilinks

- Cross-references internas: `[[V-02]]`, `[[Q-27]]` (Obsidian resuelve por nombre de archivo).
- Path completo cuando el shortname es ambiguo: `[[01-projects/itmind-infrastructure/specs/V-02]]`.
- Display alias: `[[01-projects/itmind-infrastructure/index|itmind-infrastructure]]`.
- Links a código: URL HTTP completa a GitHub.

### Callouts de Obsidian

```markdown
> [!info] Metadata
> Fecha: 2026-04-23
> Owner: Lautaro

> [!warning] Gotcha
> El REMOTE_LOG_CONN_ID no debe estar seteado cuando Airflow usa ADC.

> [!danger] Acción urgente
> F-02 requiere scale-down antes del deploy

> [!success] Validado
> Smoke tests OK en QA

> [!note] Nota
> Pendiente confirmar con @franco
```

## Bootstrap (lo hace una persona, una sola vez por la org)

Esto ya está hecho. El vault `pandora-refinery` existe en GitHub. Documentado acá por si alguna vez se rehace.

```bash
# 1. Crear repo privado pandora-refinery en la org data-oilers en GitHub
# 2. Clonar y bootstrappear estructura
git clone git@github.com:data-oilers/pandora-refinery.git ~/Development_dataoilers/pandora-refinery
cd ~/Development_dataoilers/pandora-refinery

# 3. Crear estructura PARA + scaffolding
mkdir -p _atlas _inbox 01-projects 02-areas/{infrastructure,data-engineering,security} 03-resources 04-archive meetings decisions templates
for d in _atlas _inbox 01-projects 02-areas/infrastructure 02-areas/data-engineering 02-areas/security 03-resources 04-archive meetings decisions templates; do
  touch "$d/.gitkeep"
done

# 4. Copiar templates iniciales
cp -r <obsidian-vault-mcp>/onboarding/templates/vault-skeleton/* templates/

# 5. Abrí Obsidian → Open folder as vault → seleccioná pandora-refinery
# 6. Instalá plugins: Dataview, Templater, Obsidian Git
# 7. Configurá tema, hotkeys

git add .
git commit -m "chore: bootstrap pandora-refinery vault"
git push -u origin main
```

## Onboarding de un compañero nuevo

```bash
# Clonar el vault donde tu sistema lo espere (default del MCP):
mkdir -p ~/Development_dataoilers
git clone git@github.com:data-oilers/pandora-refinery.git \
  ~/Development_dataoilers/pandora-refinery
```

Si lo clonás en otra ruta, override con env var en el `.env` del MCP:
```bash
VAULTS_DATAOILERS_PATH=/ruta/real/a/pandora-refinery
```

Después abrí Obsidian → "Open folder as vault" → seleccioná el path. Ya ves todo.

## Día a día

### Traer cambios del equipo

```bash
cd ~/Development_dataoilers/pandora-refinery
git pull
```

### Editar y pushear

Editás `01-projects/itmind-infrastructure/specs/nueva-feature.md` (sea desde Obsidian o desde Claude Code via MCP):

```bash
git add .
git commit -m "docs: spec de nueva feature"
git push
```

### Plugin Obsidian Git (recomendado)

Instalá el plugin **Obsidian Git** y configurá:
- **Pull on startup**: ON — pull automático cuando abrís Obsidian.
- **Auto-backup**: ON cada N minutos — commit + push periódico.
- Settings → Obsidian Git.

Te ahorra los `git pull/push` a mano.

## Convención de commits en el vault

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| `docs:` | nuevo documento, actualización mayor | `docs: agregar spec V-02-FIX-01` |
| `fix:` | corregir info incorrecta | `fix: corregir paths en runbook Airflow` |
| `chore:` | metadata, tags, links, cleanup | `chore: agregar wikilinks a Q-V-03` |
| `refactor:` | reorganizar estructura | `refactor: mover postmortems Q1 a archive` |

## Agregar un nuevo proyecto al vault

Cuando se suma un repo nuevo a la org y se quiere documentarlo:

```bash
cd ~/Development_dataoilers/pandora-refinery
mkdir -p 01-projects/<nombre-repo>/{decisions,docs,postmortems,runbooks,specs}
touch 01-projects/<nombre-repo>/index.md
# escribí en index.md el overview del proyecto
git add 01-projects/<nombre-repo>
git commit -m "docs: agregar proyecto <nombre-repo> al vault"
git push
```

Ver [`08-NUEVA-SUBVAULT.md`](08-NUEVA-SUBVAULT.md) para el flujo completo (incluye registrar el repo en el MCP, agregar al config, etc).
