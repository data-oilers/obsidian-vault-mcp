# 08 — Agregar un nuevo proyecto al vault

Cuándo: se suma un repo de código nuevo a la org y querés que tenga su carpeta en el vault `pandora-refinery`.

> Importante: usamos **single-vault**. No se crea un nuevo repo de Obsidian — se crea una carpeta dentro de `pandora-refinery/01-projects/`. Ver [`04-VAULT-STRUCTURE.md`](04-VAULT-STRUCTURE.md) sobre por qué.

## Procedimiento

### 1. Crear la estructura del proyecto en el vault

```bash
cd ~/Development_dataoilers/pandora-refinery
mkdir -p 01-projects/<nombre-repo>/{decisions,docs,postmortems,runbooks,specs}
touch 01-projects/<nombre-repo>/index.md
```

**Naming**: `<nombre-repo>` = nombre del repo en GitHub, en kebab-case lowercase. Ej: `enterprise-ai-platform`, no `EnterpriseAIPlatform`.

### 2. Escribir `index.md` con el overview

```markdown
---
tags: [project, <area>]
fecha: 2026-04-28
estado: in-progress
autor: tu.usuario
proyecto: "[[01-projects/<nombre-repo>/index|<nombre-repo>]]"
---

# <nombre-repo>

> 1-3 líneas describiendo qué hace el repo y para qué cliente / área.

## Stack
- Lenguaje: <Python / TypeScript / Go>
- Framework: <FastAPI / Next.js>
- Infra: <GCP / AWS>

## Repo de código
[GitHub: data-oilers/<nombre-repo>](https://github.com/data-oilers/<nombre-repo>)

## Áreas relacionadas
- [[02-areas/<area>/index]]

## Documentación de este repo
- Decisiones: [[01-projects/<nombre-repo>/decisions/index]]
- Specs: [[01-projects/<nombre-repo>/specs/index]]
- Postmortems: [[01-projects/<nombre-repo>/postmortems/index]]
- Runbooks: [[01-projects/<nombre-repo>/runbooks/index]]
```

### 3. Copiar templates iniciales (opcional)

Si querés un esqueleto de templates dentro del proyecto:

```bash
# desde el repo del MCP
cp ~/Development_dataoilers/obsidian-vault-mcp/onboarding/templates/vault-skeleton/specs/_template-spec.md \
   ~/Development_dataoilers/pandora-refinery/01-projects/<nombre-repo>/specs/_template-spec.md
# repetir para decisions, postmortems, references
```

O confiar en los templates globales del vault en `~/Development_dataoilers/pandora-refinery/templates/`.

### 4. Registrar el repo en el MCP

Para que las tools de Git (`get_repo_context`, `list_repos`, etc.) reconozcan el repo, hay dos opciones.

#### Opción A — env var en `.env` (no requiere recompilar)

En `~/Development_dataoilers/obsidian-vault-mcp/.env`:

```bash
REPO_<NAME_UPPER_SNAKE>_PATH=/Users/<usuario>/Development_dataoilers/<nombre-repo>
```

Ej: `REPO_ENTERPRISE_AI_PLATFORM_PATH=/Users/franco/Development_dataoilers/enterprise-ai-platform`.

⚠️ El env var solo funciona si el repo **ya existe** como entry en `src/config.ts`. Si no existe, ir a Opción B.

#### Opción B — agregar al código (`src/config.ts`)

Si es un repo nuevo que aún no está en `REPOS`:

```typescript
// src/config.ts
export let REPOS: Record<string, RepoConfig> = {
  "enterprise-ai-platform": { /* existente */ },
  "itmind-infrastructure":  { /* existente */ },

  "<nombre-repo>": {                              // ← NUEVO
    name: "<nombre-repo>",
    url: "https://github.com/data-oilers/<nombre-repo>",
    localPath:
      process.env.REPO_<NAME_UPPER_SNAKE>_PATH ||
      join(HOME, "repos", "data-oilers", "<nombre-repo>"),
    org: "data-oilers",
  },
};
```

Después: `npm run build` y reiniciar el proceso del MCP (o `claude mcp remove ... && claude mcp add ...`).

### 5. Clonar el repo de código

```bash
gh repo clone data-oilers/<nombre-repo> ~/Development_dataoilers/<nombre-repo>
```

Si lo clonás en otra ruta, asegurate que `REPO_<NAME>_PATH` en `.env` apunte ahí.

### 6. Verificar

```bash
# Reiniciá Claude Code, después en una sesión nueva:
# Tool: list_repos
# Esperado: que aparezca <nombre-repo> en la lista
```

### 7. Commitear los cambios

```bash
# en pandora-refinery
cd ~/Development_dataoilers/pandora-refinery
git add 01-projects/<nombre-repo>
git commit -m "docs: agregar proyecto <nombre-repo> al vault"
git push

# si tocaste src/config.ts del MCP
cd ~/Development_dataoilers/obsidian-vault-mcp
git add src/config.ts
git commit -m "config: agregar <nombre-repo> a REPOS"
# crear PR (no commitear directo a main)
gh pr create --title "config: agregar <nombre-repo> a REPOS"
```

## Cuándo NO crear una carpeta de proyecto

- **Spike o exploración corta** (< 1 semana): mejor usá `_inbox/` y movés cuando se confirme.
- **Proyecto que no tiene repo de código asociado**: probablemente sea un **área** (`02-areas/<área>/`) o un **resource** (`03-resources/`).
- **Cliente / cuenta**: si es una relación comercial ongoing, va en `02-areas/clients/<cliente>/` (no en `01-projects/`).

## Cuándo archivar un proyecto

Cuando el repo se archive o el equipo deje de mantenerlo:

```bash
cd ~/Development_dataoilers/pandora-refinery
git mv 01-projects/<nombre-repo> 04-archive/<nombre-repo>
# actualizar wikilinks rotos: grep -rE "01-projects/<nombre-repo>" --include="*.md"
git commit -m "archive: <nombre-repo> deprecated"
```

También sacar de `REPOS` en `src/config.ts` del MCP (o no, depende si querés que las herramientas Git sigan funcionando para queries históricas).

## Referencias

- Convención completa de naming/estructura: [`../VAULT-CONVENTIONS.md`](../VAULT-CONVENTIONS.md)
- Estructura general del vault: [`04-VAULT-STRUCTURE.md`](04-VAULT-STRUCTURE.md)
