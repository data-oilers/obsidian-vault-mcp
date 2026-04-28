# Onboarding Claude Code + Obsidian — DataOilers

Material para que cualquier persona del equipo tenga el mismo setup de Claude Code + MCP del equipo + vault de Obsidian + skills, y pueda leer/editar/crear documentación de los repos de la org de la misma manera.

## Repos de referencia

| Repo | Qué tiene |
|---|---|
| [`data-oilers/obsidian-vault-mcp`](https://github.com/data-oilers/obsidian-vault-mcp) | El **MCP server** que usa todo el equipo. Fuente canónica para tools y config. |
| `data-oilers/pandora-refinery` | El **vault del equipo** (Obsidian). Único git repo, todos los proyectos como folders en `01-projects/<repo-name>/`. |

Este onboarding (`obsidian-vault-mcp/onboarding/`) son material y scripts para instalar y configurar lo anterior end-to-end en una máquina nueva.

## Qué resuelve este paquete

1. **Claude Code configurado igual en todas las máquinas** — mismas configs, plugins, skills, convenciones.
2. **obsidian-vault-mcp instalado + compilado + registrado** apuntando al checkout del repo.
3. **Vault `pandora-refinery` clonado y configurado** con paths efectivos en el `.env` del MCP.
4. **Convenciones compartidas** (kebab-case, PARA + LYT, frontmatter) ver [`../VAULT-CONVENTIONS.md`](../VAULT-CONVENTIONS.md).

## Arquitectura en una frase

> **Single-vault.** El equipo trabaja sobre un único repo de Obsidian (`pandora-refinery`) organizado con [PARA + LYT Atlas](../VAULT-CONVENTIONS.md). Cada repo de código tiene su carpeta en `01-projects/<repo-name>/`. El MCP `obsidian-vault-mcp` conecta Claude con el vault + el git/GitHub de la org + memoria compartida de reuniones y decisiones.

## Quick start

Si tenés apuro: [`DAY-1-CHECKLIST.md`](DAY-1-CHECKLIST.md).

```bash
# 1. Cloná el repo del MCP
git clone https://github.com/data-oilers/obsidian-vault-mcp.git ~/Development_dataoilers/obsidian-vault-mcp

# 2. Cloná el vault del equipo
git clone git@github.com:data-oilers/pandora-refinery.git ~/Development_dataoilers/pandora-refinery

# 3. Setup automático (no destructivo, mergea con tu config existente)
cd ~/Development_dataoilers/obsidian-vault-mcp/onboarding
MCP_DIR=~/Development_dataoilers/obsidian-vault-mcp ./setup.sh

# 4. Skills (default --dev, skip-if-exists)
./install-skills.sh

# 5. Config manual mínima en ~/Development_dataoilers/obsidian-vault-mcp/.env:
#    GITHUB_TOKEN=ghp_...
#    GITHUB_ORG=data-oilers
#    VAULTS_DATAOILERS_PATH=/Users/<you>/Development_dataoilers/pandora-refinery
#    REPO_<NAME>_PATH=... por cada repo de código que tengas clonado

# 6. Registrar el MCP en Claude Code
claude mcp add -s user obsidian-vault-team-context -- node ~/Development_dataoilers/obsidian-vault-mcp/dist/index.js

# 7. Smoke test
./verify.sh
```

## Orden sugerido de lectura

1. [`01-INSTALACION.md`](01-INSTALACION.md) — Claude Code, Node, Obsidian, git
2. [`02-CONFIGURACION-CLAUDE.md`](02-CONFIGURACION-CLAUDE.md) — `~/.claude/CLAUDE.md` y `~/.claude/settings.json`
3. [`03-MCP-Y-PLUGINS.md`](03-MCP-Y-PLUGINS.md) — **obsidian-vault-mcp**, GitHub MCP, plugin claude-mem
4. [`04-VAULT-STRUCTURE.md`](04-VAULT-STRUCTURE.md) — estructura del vault `pandora-refinery` (PARA + LYT)
5. [`05-FLUJO-TRABAJO.md`](05-FLUJO-TRABAJO.md) — las 25+ tools del MCP con prompts de ejemplo
6. [`06-TROUBLESHOOTING.md`](06-TROUBLESHOOTING.md) — problemas comunes
7. [`07-SKILLS.md`](07-SKILLS.md) — skill packs (obsidian-skills, superpowers, skills oficiales)
8. [`08-NUEVA-SUBVAULT.md`](08-NUEVA-SUBVAULT.md) — agregar un nuevo proyecto/repo al vault
9. [`FAQ.md`](FAQ.md) — preguntas frecuentes
10. [`DAY-1-CHECKLIST.md`](DAY-1-CHECKLIST.md) — checklist de primer día

## Docs de referencia del MCP (raíz del repo)

- [`../README.md`](../README.md) — overview, qué es, cómo arrancar.
- [`../VAULT-CONVENTIONS.md`](../VAULT-CONVENTIONS.md) — convención de carpetas, naming, PARA + LYT.
- [`../QUICK-START.md`](../QUICK-START.md) — registrar el MCP en Claude en 3 pasos.
- [`../INSTALLATION.md`](../INSTALLATION.md) — setup detallado (env vars, team members, repos).
- [`../CONFIGURATION.md`](../CONFIGURATION.md) — config paso-a-paso (vaults, GitHub, Claude Code).
- [`../USAGE.md`](../USAGE.md) — referencia de cada tool con parámetros y ejemplos.
- [`../EXAMPLES.md`](../EXAMPLES.md) — casos de uso reales.
- [`../ROADMAP.md`](../ROADMAP.md) — Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 en progreso.

## Scripts

| Script | Qué hace |
|---|---|
| [`setup.sh`](setup.sh) | Bootstrap: pull de `obsidian-vault-mcp`, `npm install && npm run build`, mergea templates a `~/.claude/` (no-destructivo), clona meta vault si `VAULT_REPO` está seteado. Idempotente. |
| [`verify.sh`](verify.sh) | Smoke test: binarios, configs de Claude, MCP compilado + arranca OK, `.env` completado, plugin claude-mem. Cross-platform (macOS/Linux). |
| [`install-skills.sh`](install-skills.sh) | Clona skill packs en `~/.claude/skills/`. Default `skip-if-exists` (no toca lo ya instalado). Flags: `--minimal`, `--dev` (default), `--all`, `--update`, `--list`. |

## Templates listos para copiar

En `templates/`:

| Archivo | Dónde va | Qué es |
|---|---|---|
| `CLAUDE.md` | `~/.claude/CLAUDE.md` | Instrucciones globales para Claude (convención de vault) |
| `settings.json` | `~/.claude/settings.json` | Config global (permisos default, plugins) |
| `settings.local.json.example` | `<repo>/.claude/settings.local.json` | Permisos scoped al repo |
| `mcp.json` | `<repo>/.mcp.json` | Registro del `obsidian-vault-mcp` en un repo |
| `proyecto.CLAUDE.md` | `<repo>/CLAUDE.md` | Instrucciones project-level |
| `vault-skeleton/` | Esqueleto de un nuevo proyecto en `01-projects/` | Carpetas `specs/`, `decisions/`, `postmortems/`, `references/` con templates de notas |

## Pre-requisitos de la org

- ✅ Repo `data-oilers/obsidian-vault-mcp` — existe, Phases 1-3 completas, Phase 4 (audio) en progreso.
- ✅ Repo `data-oilers/pandora-refinery` — vault del equipo, single-vault con estructura PARA + LYT Atlas.
- ✅ GitHub Token con scope `repo:read` + `org:read` para discovery (ver [`../INSTALLATION.md`](../INSTALLATION.md)).
