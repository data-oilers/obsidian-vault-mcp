# Especificación Fase 5: Convención del Vault + Onboarding Cross-Platform + Single-Vault Architecture

**Estado:** Completado
**Timeline:** 1 sprint
**Equipo:** Refactor liderado por Franco (CTO)
**Alcance:** Estandarización de la convención del vault, refactor del MCP a paths kebab-case + inglés, migración de `pandora-refinery`, onboarding cross-platform no-destructivo, y rediseño de toda la documentación con arquitectura single-vault.

---

## 1. Contexto y motivación

### El problema

Antes de esta fase, el repo `obsidian-vault-mcp` tenía tres convenciones de carpetas conviviendo y contradiciéndose:

1. **Hardcoded en código** (`src/tools/`): `Reuniones/`, `Decisiones/`, `Personas/`, `Repos/`, `_Mapa del Equipo.md` — español, TitleCase, con espacios.
2. **CLAUDE.md global del equipo** (template): `Specs/`, `Decisiones/`, `Postmortems/`, `Referencias/` — declarativa pero distinta de lo que el código creaba.
3. **Vault real `pandora-refinery`**: `_Atlas/`, `Projects/ITMIND-INFRASTRUCTURE/`, `Templates/` — TitleCase mezclado con UPPERCASE.

Resultado: cuando un compañero corría `create_meeting_note` se creaba `Reuniones/` que nadie sabía qué era, y `Decisiones/` declarado en CLAUDE.md no existía en ningún lado.

Adicionalmente, los docs (10+ archivos `.md` en raíz + onboarding) referenciaban una **arquitectura multi-vault con git submodules** (`dataoilers-vault-org` meta repo + `dataoilers-vault-<repo>` submodules) que **nunca se había implementado** — el equipo en la práctica usaba un único vault `pandora-refinery`.

### El problema secundario

El paquete `onboarding/` (creado en una fase previa) tenía riesgos para usuarios que ya tenían config personal en `~/.claude/`:
- `setup.sh` sobrescribía `~/.claude/CLAUDE.md` y `~/.claude/settings.json`.
- `install-skills.sh` hacía `git pull` automático sobre packs ya clonados, pisando customizaciones.
- `verify.sh` usaba `timeout` (GNU coreutils) que no existe en macOS por default.
- Docs Windows-centric (paths como `D:\obsidian-vault-mcp\dist\index.js`) sin equivalentes Linux/macOS.

### La motivación

> Sin una convención única y documentada, el MCP genera caos en lugar de orden. Cualquier compañero que clone el repo debería poder hacerlo funcionar de punta a punta con su propia config preservada y entendiendo dónde va cada cosa en el vault.

---

## 2. Decisiones arquitectónicas

Las decisiones se tomaron iterativamente vía `AskUserQuestion`, con evidencia de PKM best practices (LYT framework de Nick Milo, PARA de Tiago Forte) cuando aplicaba.

### 2.1 Single-vault vs multi-vault

**Decidido: single-vault `pandora-refinery`.**

Trade-off considerado: multi-vault con submodules permitía permisos granulares por repo + commits limpios + historia independiente. La fricción de submodules (necesidad de `git submodule update --remote`, doble commit en push, etc.) supera el beneficio para un equipo de 8 personas que trabaja transversalmente.

Si el equipo crece y necesita permisos granulares (ej. cliente que solo ve "su" área), evaluamos migración. Por ahora KISS.

### 2.2 Convención de carpetas

**Decidido: kebab-case + lowercase + inglés.**

| Decisión | Rationale |
|---|---|
| **kebab-case** | Convención ampliamente usada en Unix paths, terminal-friendly, single source of truth con `<repo>` names en GitHub. |
| **lowercase** | Coherencia con kebab-case, no hay que apretar shift, evita problemas case-(in)sensitive en filesystems. |
| **Inglés** | Match con `_atlas/` y `templates/` que ya estaban en inglés. Plug-and-play con templates de la comunidad. |
| **Plurales** | Best practice en PKM (Obsidian forum): "always pluralize categories". `decisions/`, no `decision/`. |
| **Numeración 2-dígitos** (`01-`, `02-`) | File managers ordenan alfabéticamente; con 1 dígito `10/` viene antes que `2/`. Convención Johnny Decimal. |

### 2.3 Modelo de organización

**Decidido: PARA + LYT Atlas.**

Combinación de:
- **PARA** (Tiago Forte): Projects/Areas/Resources/Archive — organiza por accionabilidad.
- **LYT** (Nick Milo): Atlas como único nav hub con MOCs (Maps of Content).

Estructura final:
```
pandora-refinery/
├── _atlas/                ← ÚNICO nav hub: MOCs por tema + auto-gen indices
├── _inbox/                ← captura rápida
├── 01-projects/           ← work activo (PARA: Projects)
├── 02-areas/              ← responsabilidades ongoing (PARA: Areas)
├── 03-resources/          ← refs externas (PARA: Resources)
├── 04-archive/            ← inactivos (PARA: Archive)
├── meetings/              ← MCP: time-based (LYT: Calendar zone)
├── decisions/             ← MCP: ADRs
└── templates/             ← templates copiables
```

**Regla del Atlas único hub**: TODO lo navegacional vive en `_atlas/`. Si mañana agregamos `clients/` o `tools/` (también auto-gen MOCs), van adentro de `_atlas/` para no engordar la raíz.

### 2.4 Singular vs plural en `_atlas/`

**Decidido: archivo singular = curado a mano, folder plural = auto-generado.**

```
_atlas/
├── people-overview.md       ← narrativa curada a mano (singular)
├── technologies-overview.md
├── people/                  ← MCP: 1 nota auto-gen por persona (plural)
└── repos/                   ← MCP: 1 nota auto-gen por repo
```

Esto evita conflictos de filename: `_atlas/people.md` y `_atlas/people/` no pueden coexistir; con la convención singular vs plural quedan diferenciados.

### 2.5 Onboarding no-destructivo

**Decidido: `setup.sh` mergea en lugar de sobrescribir.**

- `~/.claude/CLAUDE.md`: bloque delimitado por marcadores `<!-- BEGIN/END dataoilers-team -->`. Si los marcadores existen, reemplaza solo el bloque; si no, appendea al final. Backup automático con timestamp.
- `~/.claude/settings.json`: deep-merge JSON (con `node`, sin dependencia de `jq`). Las keys del usuario tienen prioridad; solo se agregan las del template que faltan. Para `enabledPlugins` y `extraKnownMarketplaces` se hace union.

**Decidido: `install-skills.sh` default skip-if-exists.**

- Si un pack de skills ya está clonado (o existe como symlink/dir suelto), **NO se toca** por default.
- Flag `--update` para opt-in al `git pull --ff-only`.
- Flag `--list` / `--dry-run` para preview.

### 2.6 Método de registro del MCP en Claude Code

**Decidido: `claude mcp add -s user` como método principal, UI manual como secundario.**

Razón: idempotente, scriptable, soporta scopes (`user`/`project`/`local`), 1 comando vs 5 clicks en Settings.

### 2.7 Cross-platform first

**Decidido: docs y scripts cross-platform desde el principio.**

- Paths en docs: ejemplos para macOS, Linux, Windows.
- `verify.sh`: smoke test del MCP usa `kill -0` + `sleep` (portable) en vez de `timeout` (GNU-only).
- `src/config.ts`: env vars `VAULTS_<NAME>_PATH` y `REPO_<NAME>_PATH` con defaults `homedir() + Documentos/<NAME>`.

---

## 3. Cambios implementados

### 3.1 Refactor del código del MCP

**Archivos tocados:**
- `src/tools/meeting-tools.ts:112` — `"Reuniones"` → `"meetings"`.
- `src/tools/obsidian-sync-tools.ts`:
  - `"Personas"` → `"_atlas/people"` (línea 366).
  - `"Repos"` → `"_atlas/repos"` (línea 378).
  - `"Decisiones"` → `"decisions"` (línea 390).
  - `"_Mapa del Equipo.md"` → `"_atlas/team-map.md"` (línea 418).
  - Comments y `created.push(...)` strings actualizados acordemente.
- `src/index.ts:398` — descripción de `sync_graph_to_obsidian` actualizada con paths nuevos.

**Conservado:** display strings en español (UI text como `## Decisiones` dentro de meeting notes generadas) — folder paths cambian a inglés, prosa visible al usuario queda en español.

### 3.2 Migración de `pandora-refinery`

Script `pandora-migrate.sh` ejecutado contra el vault del CTO. Operaciones:

1. **Top-level renames**:
   - `_Atlas/` → `_atlas/`
   - `Templates/` → `templates/`
   - `Projects/` → `01-projects/`
   - `Projects/ITMIND-INFRASTRUCTURE/` → `01-projects/itmind-infrastructure/`
   - `Home.md` → `home.md`

2. **Scaffolding nuevo**: `_inbox/`, `02-areas/{infrastructure,data-engineering,security}/`, `03-resources/`, `04-archive/`, `meetings/`, `decisions/` con `.gitkeep`.

3. **Subcarpetas dentro del proyecto** (ES → EN, lowercase):
   - `Decisiones/` → `decisions/`
   - `Specs/` → `specs/`
   - `Postmortems/` → `postmortems/`
   - `Runbooks/` → `runbooks/`
   - `Docs/` → `docs/`

4. **MOCs renombradas**:
   - `MOC-Airflow.md` → `moc-airflow.md` (etc, todos los MOC-*.md)
   - `_Atlas/People.md` → `_atlas/people-overview.md` (singular = curado)
   - `_Atlas/Technologies.md` → `_atlas/technologies-overview.md`

5. **Templates renames**:
   - `Decision-ADR.md` → `decision-adr.md` (etc, todos los Templates/*.md)

6. **Wikilinks update** (sed): 256 archivos `.md` procesados con regex de:
   - `[[_Atlas/MOC-Airflow]]` → `[[_atlas/moc-airflow]]`
   - `[[../Projects/ITMIND-INFRASTRUCTURE/Decisiones/...]]` → `[[../../01-projects/itmind-infrastructure/decisions/...]]`
   - `[[ITMIND-INFRASTRUCTURE]]` → `[[01-projects/itmind-infrastructure/index|itmind-infrastructure]]`
   - 19 reemplazos totales aplicados a todo el árbol.

**Resultado**: 224 renames + 31 rename+modified + 8 added (gitkeeps), **0 wikilinks rotos**.

**Nota técnica**: macOS APFS es case-insensitive por default; el script usa doble-rename (`git mv X X.tmp && git mv X.tmp x`) para renames case-only.

### 3.3 Refactor de docs

#### Eliminados
- `TOOLS.md` — duplicaba contenido de `USAGE.md` y solo cubría 15 de 29 tools (desactualizado).

#### Renombrados
- `SETUP.md` → `INSTALLATION.md` (qué instalar, requisitos).
- `CONFIGURACION-MCP.md` → `CONFIGURATION.md` (cómo configurar después del install).

#### Reescritos completamente
- `onboarding/04-VAULT-STRUCTURE.md`: arquitectura single-vault explicada (no más multi-vault con submodules).
- `onboarding/README.md`: paths reales, scripts actualizados, eliminadas refs a `dataoilers-vault-org`.
- `onboarding/templates/CLAUDE.md`: convenciones single-vault con bloque PARA + LYT Atlas.

#### Creados
- `README.md` (raíz): overview, quick start de 4 pasos, mapa completo de docs.
- `VAULT-CONVENTIONS.md` (raíz): convención canónica del vault con decision tree "¿dónde va una nota nueva?".
- `onboarding/08-NUEVA-SUBVAULT.md`: procedimiento para agregar un proyecto nuevo al vault.

#### Updates terminológicas (mecánicas)
Reemplazos en todos los docs (`QUICK-START.md`, `INSTALLATION.md`, `CONFIGURATION.md`, `USAGE.md`, `EXAMPLES.md`, `ROADMAP.md`, `CLAUDE.md`, todos los `onboarding/*.md`):
- Folder names: `Reuniones/`→`meetings/`, `Decisiones/`→`decisions/`, `Personas/`→`_atlas/people/`, `Repos/`→`_atlas/repos/`, `_Mapa del Equipo.md`→`_atlas/team-map.md`.
- Subfolder names: `Specs/`→`specs/`, `Postmortems/`→`postmortems/`, `Referencias/`→`references/`.
- Vault names: `FACULTAD`/`PROYECTOS` → `DATAOILERS`.
- Repo: `poc-macro-riesgo` → `itmind-infrastructure`.
- Doc refs: `TOOLS.md`/`SETUP.md`/`CONFIGURACION-MCP.md` → nuevos nombres.
- Multi-vault paths (`~/Documentos/PROYECTOS/dataoilers-vault-org`) → single-vault (`~/Development_dataoilers/pandora-refinery`).

#### Conservados intencionalmente
- `specs/FASE-1` a `FASE-4`: mantienen terminología original como documentos históricos del diseño en su momento (decisión explícita del CTO).
- 1 ref a `FACULTAD` en `USAGE.md` línea 86: contextual, explica el legado del parámetro `subject`.

### 3.4 Refactor de scripts de onboarding

**`onboarding/setup.sh`**:
- Función `merge_claude_md`: reemplaza/appendea bloque delimitado, preserva config existente.
- Función `merge_settings_json`: deep-merge JSON con prioridad al usuario, union para `enabledPlugins`/`extraKnownMarketplaces`.
- Backup automático con timestamp.
- Imprime `claude mcp add` exacto en "Próximos pasos manuales".

**`onboarding/install-skills.sh`**:
- Default skip-if-exists (no toca packs ya instalados, incluyendo symlinks).
- Flags: `--update`, `--list`/`--dry-run`, `--skills-dir <path>`, `--minimal`/`--dev`/`--all`.
- Detecta 4 estados (absent/symlink/git-repo/non-git) y actúa apropiadamente.
- Resumen final con counts (cloned/updated/skipped/failed).

**`onboarding/verify.sh`**:
- Smoke test del MCP cross-platform: usa `node ... < /dev/zero & PID=$!; sleep 2; kill -0 $PID` en vez de `timeout` (GNU-only).
- Detección mejorada de `GITHUB_TOKEN` placeholder (rechaza `ghp_your_token_here`).

**`onboarding/templates/vault-skeleton/`**:
- Folders renombrados a kebab-case: `Specs/`→`specs/`, `Decisiones/`→`decisions/`, `Postmortems/`→`postmortems/`, `Referencias/`→`references/`.

### 3.5 Configuración

**`src/config.ts`**:
- `REPOS`: reemplazado `poc-macro-riesgo` (legacy) por `itmind-infrastructure` (canónico según CLAUDE.md global del equipo).
- `VAULTS`: reducido a solo `DATAOILERS` (eliminados `FACULTAD` y `PROYECTOS` que eran personales del CTO).
- `DATAOILERS.hasGit`: `false` → `true` (pandora-refinery es git repo).

**`.env.example`**:
- Limpieza de placeholders Alice/Bob/Charlie por nombres reales del equipo (Emiliano, Emanuel, Agustin, Lautaro, Franco, Branco, Gaston, Eliezer).
- Removidas refs a vaults eliminados.
- Comentarios actualizados.

**`.gitignore`**:
- Ignora CLAUDE.md auto-injectados por claude-mem en subdirs (`onboarding/CLAUDE.md`, `src/CLAUDE.md`, etc).
- Mantiene tracked los CLAUDE.md legítimos (raíz y `onboarding/templates/`).

### 3.6 Cross-platform fixes

- Docs (QUICK-START.md, CONFIGURATION.md, USAGE.md): ejemplos para macOS/Linux/Windows con paths apropiados.
- `verify.sh`: portable a macOS sin GNU coreutils.
- `pandora-migrate.sh`: doble-rename trick para filesystems case-insensitive.
- `src/config.ts`: defaults cross-platform via `homedir()` + `join()`.

---

## 4. Convención de carpetas finalizada

Documentada en detalle en `VAULT-CONVENTIONS.md`. Resumen:

```
pandora-refinery/
├── _atlas/                       ← LYT nav hub (curado + auto-gen)
│   ├── moc-<tema>.md             ← MOCs curadas a mano (singular)
│   ├── <entity>-overview.md      ← narrativas curadas (singular)
│   ├── team-map.md               ← MCP: knowledge graph Mermaid
│   ├── people/                   ← MCP: 1 MOC auto-gen por persona (plural)
│   └── repos/                    ← MCP: 1 MOC auto-gen por repo
├── _inbox/                       ← captura rápida (procesar en < 1 semana)
├── 01-projects/                  ← PARA: work activo con deadline
│   └── <repo-name>/
│       ├── index.md
│       ├── decisions/            ← ADRs del proyecto
│       ├── docs/                 ← docs técnicas
│       ├── postmortems/          ← incidentes
│       ├── runbooks/             ← playbooks operativos
│       └── specs/                ← RFCs / diseños
├── 02-areas/                     ← PARA: responsabilidades ongoing
│   ├── infrastructure/
│   ├── data-engineering/
│   └── security/
├── 03-resources/                 ← PARA: refs externas
├── 04-archive/                   ← PARA: inactivos
├── meetings/                     ← MCP: notas de reunión time-based
├── decisions/                    ← MCP: ADRs y decisiones del equipo
├── templates/                    ← templates copiables
├── home.md                       ← landing page
└── README.md
```

### Frontmatter estándar

```yaml
---
tags: [spec, infrastructure, security]
fecha: 2026-04-23
estado: in-progress | completado | deprecated | draft
autor: nombre.apellido
proyecto: "[[01-projects/<repo>/index|<repo>]]"
relacionado:
  - "[[V-02]]"
---
```

### Decision tree para "¿dónde va esta nota?"

```
¿Sobre un repo de código específico?
  SÍ → 01-projects/<repo>/{decisions,specs,postmortems,runbooks,docs}/
  NO → ¿Decisión transversal del equipo?
    SÍ → decisions/ (top-level)
    NO → ¿Reunión?
      SÍ → meetings/ (top-level, lo crea create_meeting_note)
      NO → ¿Responsabilidad ongoing?
        SÍ → 02-areas/<área>/
        NO → ¿Referencia externa?
          SÍ → 03-resources/
          NO → ¿Captura rápida sin clasificar?
            SÍ → _inbox/
            NO → ¿MOC / índice navegacional?
              SÍ → _atlas/moc-<tema>.md
```

---

## 5. Auto-generación por el MCP

Tabla canónica de paths donde el MCP escribe (definida en `src/tools/`):

| Tool | Path destino |
|---|---|
| `create_meeting_note` | `meetings/YYYY-MM-DD-<slug>.md` |
| `sync_graph_to_obsidian` (people) | `_atlas/people/<nombre>.md` |
| `sync_graph_to_obsidian` (repos) | `_atlas/repos/<repo>.md` |
| `sync_graph_to_obsidian` (decisions) | `decisions/<slug>.md` |
| `sync_graph_to_obsidian` (team map) | `_atlas/team-map.md` |

---

## 6. Procedimiento de migración (replicable)

Si en el futuro otro miembro del equipo recibe un vault con la convención vieja, el procedimiento es:

1. **Auditar**: `grep -rE "(Reuniones|Decisiones|Personas|Repos)" --include="*.md"` para inventario.
2. **Working tree limpio**: `git status --porcelain | wc -l` debe dar 0.
3. **Renames con doble-rename trick** (case-insensitive filesystems).
4. **sed sobre wikilinks** con la lista de reemplazos del script `pandora-migrate.sh`.
5. **Validar 0 wikilinks rotos**: `grep -rE "\[\[.*(_Atlas|Projects/...)" --include="*.md"`.
6. **Abrir en Obsidian** y validar Graph View / Cmd+Click sobre wikilinks.
7. **Commit, NO push**: dejar staged para review manual antes de pushear.

El script `pandora-migrate.sh` se preservó en `/tmp/` durante la sesión; si se necesita re-usar, está documentado en este spec con todos los reemplazos.

---

## 7. Decisiones explícitas registradas (vía AskUserQuestion)

| Decisión | Opciones presentadas | Elegido | Rationale |
|---|---|---|---|
| Convención de carpetas | TitleCase / kebab-case / mixto | **kebab-case lowercase** | Coherencia, terminal-friendly. |
| Idioma | Inglés / Español / Mixto | **Inglés** | Match con templates de comunidad. |
| Modelo PARA | PARA numerado / sin numeración / por dominio / mínimo+tags | **PARA numerado 2-dígitos** | Orden semántico activo→inactivo, ordering correcto. |
| Refactor MCP | Sí completo / configurable / no | **Sí completo** | Single source of truth. |
| `_atlas/people/repos/` | top-level / dentro de _atlas/ / dentro de 02-areas/ | **dentro de _atlas/** | LYT framework: atlas único nav hub. |
| Migración vault | Sí ahora / mostrame el script / después | **Sí ahora** | Working tree limpio, momento óptimo. |
| TOOLS.md | eliminar / mantener / mergear en TOOLS | **eliminar** | Duplicaba USAGE.md, desactualizado. |
| SETUP/CONFIGURACION | renombrar / mergear / dejar | **renombrar** (INSTALLATION.md / CONFIGURATION.md) | Separar audiencias install vs config. |
| Docs nuevos | README, VAULT-CONVENTIONS, NUEVA-SUBVAULT, MIGRATION | **README + VAULT-CONVENTIONS + NUEVA-SUBVAULT** | (MIGRATION descartado por baja necesidad). |
| specs/FASE-* viejas | dejar como históricas / actualizar / mover a archive | **dejar como históricas** | Reflejan diseño del momento, valor de archivo. |
| Arquitectura del vault | single-vault / multi-vault submodules / híbrido | **single-vault** | Menor fricción, suficiente para tamaño actual del equipo. |

---

## 8. Resultado y métricas

### Archivos afectados (en este repo `obsidian-vault-mcp`)

- **30 archivos modificados** en el commit `724a1c7` (overhaul de docs).
- **+856 líneas insertadas, -741 líneas eliminadas** (rebalanceo de contenido).
- **3 docs creados**: `README.md`, `VAULT-CONVENTIONS.md`, `onboarding/08-NUEVA-SUBVAULT.md`.
- **1 doc eliminado**: `TOOLS.md`.
- **2 docs renombrados**: `SETUP.md`→`INSTALLATION.md`, `CONFIGURACION-MCP.md`→`CONFIGURATION.md`.
- **8 folders/files renombrados** dentro de `vault-skeleton/`.

### Archivos afectados (en vault `pandora-refinery`)

- **256 notas markdown** procesadas.
- **224 renames** + **31 rename+modified** + **8 added** (gitkeeps).
- **0 wikilinks rotos** después de la migración.
- **19 patrones de reemplazo** aplicados en wikilinks vía sed.

### Commits de la fase

```
1497063 Config: env vars para VAULTS y REPOS con defaults cross-platform
5cc759b Docs: ejemplos Linux/macOS y usar env vars en vez de editar TS
bfde581 Agregar onboarding/ — paquete de setup para miembros nuevos
1fc125f Onboarding: setup no-destructivo + cross-platform fixes
c9d222b Docs: recomendar `claude mcp add` como método principal de registro
a2fa900 Config: ajustar VAULTS y REPOS al uso real del equipo
9ca2786 Refactor: convención de carpetas a kebab-case + lowercase + inglés (LYT Atlas)
724a1c7 Docs: alinear repo con single-vault pandora-refinery + PARA + LYT Atlas
```

(El commit con esta spec — `FASE-5-ESPECIFICACION.md` — se agrega al final.)

---

## 9. Pendientes y trabajo a futuro

### Para el equipo (acción inmediata)

- **Cada miembro del equipo** debe re-ejecutar `onboarding/setup.sh` para que el merge actualizado del CLAUDE.md global tome efecto en su `~/.claude/CLAUDE.md`. Es no-destructivo (preserva config personal).
- **Pandora-refinery**: los renames están staged en la máquina del CTO pero NO commiteados. Una vez validado en Obsidian (Graph View, click en wikilinks), commitear y pushear para que el equipo pull la nueva estructura.
- **Push de los 7 commits** locales a `origin/main` en `obsidian-vault-mcp`.

### Pendiente técnico (no crítico)

- **Auto-discovery del MCP**: `src/git/repo-discovery.ts:30-43` tiene código stub para descubrir repos del org via `@octokit/rest`. La dependencia está instalada pero el código real está comentado. Implementarlo permitiría que `list_repos` reflejae la org sin necesidad de configurar cada repo manualmente.
- **Subject parameter legacy**: `create_note` tiene un parámetro `subject` que mapea a `SUBJECT_TAGS` de la versión académica del MCP (vault FACULTAD). En el modelo PARA del vault del equipo, "subject" no aplica del mismo modo. Considerar deprecar o renombrar a `area`/`folder` con semántica nueva.
- **`hasGit` en VaultConfig**: el campo está declarado pero nunca usado en el código. Decidir si se elimina o se le da uso (ej. operaciones git automáticas sobre vaults con git).

### Mejoras de docs (cuando haya tiempo)

- **Diagrama visual** de PARA + LYT en `VAULT-CONVENTIONS.md` (Mermaid o SVG embebido).
- **Tutorial walkthrough** en `EXAMPLES.md` que cubra todo el flujo: registrar reunión → crear ADR → linkear commits → ver impact.
- **Migración guide** (`MIGRATION.md`) si en el futuro algún equipo necesita migrar de la convención vieja.

---

## 10. Referencias

- [PARA Method (Tiago Forte)](https://fortelabs.com/blog/para/) — Projects/Areas/Resources/Archive
- [LYT (Nick Milo)](https://www.linkingyourthinking.com/) — Atlas, MOCs, Linked Thinking
- [Johnny Decimal System](https://johnnydecimal.com/) — Numeración por categorías
- [Obsidian forum: How to Structure Notes](https://forum.obsidian.md/t/how-to-structure-notes-categories-tags-and-folders/103125)
- [Steph Ango: How I use Obsidian](https://stephango.com/vault)
- [TrustedSec: Obsidian for collective consciousness](https://trustedsec.com/blog/obsidian-taming-a-collective-consciousness)

---

**Conclusión**: El repositorio queda listo para que cualquier compañero lo clone y tenga el MCP funcionando contra `pandora-refinery` con paths consistentes, sin sorpresas, y con docs single source of truth para cada decisión.
