# Especificación Fase 1: MCP Obsidian Multi-Repo + Contexto de Equipo

**Estado:** Aprobado  
**Timeline:** 2 sprints  
**Equipo:** 8 personas  
**Alcance:** Descubrimiento multi-repo + Contexto Git + Integración Memory

---

## 1. Descripción General

Este servidor MCP integra vaults de Obsidian, repositorios Git y Claude Memory para proporcionar **contexto compartido de equipo** en una organización.

**Problema:** El equipo de 8 personas trabaja en múltiples repos → difícil saber quién hizo qué, qué se decidió, qué tareas están pendientes.

**Solución:** Contexto centralizado mediante:
- Histórico de commits + estadísticas de múltiples repos
- Notas de reunión con decisiones e items de acción
- Claude Memory para base de conocimiento searchable

---

## 2. Arquitectura

```
Claude Memory (plugin claude-mem)
         ↓ (guardar/buscar)
┌─────────────────────────────────┐
│   Servidor MCP                  │
│   - Herramientas Git            │
│   - Herramientas Reuniones      │
│   - Wrapper Memory              │
└──────────┬──────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Fuentes de Datos              │
│   - Repos GitHub Org (N repos)  │
│   - Vaults Obsidian (3)         │
│   - Repos git locales           │
└─────────────────────────────────┘
```

---

## 3. Configuración

### 3.1 Descubrimiento Multi-Repo

**Opción A: Organización GitHub (SELECCIONADO)**

```typescript
// config.ts
export const GIT_CONFIG = {
  mode: "github-org",
  org: "nombre-empresa",              // Nombre org GitHub
  githubToken: process.env.GITHUB_TOKEN,
  cacheDir: "~/.claude/git-cache",
  refreshInterval: 3600000,            // 1 hora
};

export const TEAM_MEMBERS = [
  "Alice", "Bob", "Charlie", "Diana",
  "Eve", "Frank", "Grace", "Henry"
];

export const VAULTS = {
  FACULTAD: { path: "...", hasGit: true },
  DATAOILERS: { path: "...", hasGit: false },
  PROYECTOS: { path: "...", hasGit: false },
};
```

### 3.2 Configuración de Equipo

```typescript
export interface TeamMember {
  name: string;
  email: string;
  role?: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { name: "Alice", email: "alice@company.com", role: "Backend Lead" },
  { name: "Bob", email: "bob@company.com", role: "Frontend" },
  // ... 8 total
];
```

---

## 4. Modelos de Datos

### 4.1 Contexto Git

```typescript
interface CommitInfo {
  hash: string;
  author: string;
  date: Date;
  message: string;
  filesChanged: string[];
}

interface RepoContext {
  name: string;
  recentCommits: CommitInfo[];
  currentBranch: string;
  stats: {
    commitsThisMonth: number;
    activeAuthors: string[];
    commitsByAuthor: Record<string, number>;
  };
  lastUpdated: Date;
}

interface FileHistory {
  filePath: string;
  commits: CommitInfo[];
}
```

### 4.2 Entrada de Reunión (en Memory)

```typescript
interface MeetingEntry {
  id: string;
  timestamp: Date;
  title: string;
  summary: string;
  
  participants: string[];
  decisions: Decision[];
  actionItems: ActionItem[];
  
  vault: string;
  notePath: string;
  relatedRepos?: string[];
}

interface Decision {
  text: string;
  owner?: string;
  relatedIssue?: string;
}

interface ActionItem {
  task: string;
  owner: string;
  dueDate: Date;
  status: "pending" | "in-progress" | "completed";
  relatedIssue?: string;
}
```

### 4.3 Respuesta de Búsqueda en Memory

```typescript
interface MemoryQueryResult {
  entries: MemoryEntry[];
  totalCount: number;
  timeRange: { from: Date; to: Date };
}

interface TeamContextSnapshot {
  timeframe: "week" | "month";
  summary: string;
  contributors: { name: string; commits: number; activity: string }[];
  recentDecisions: Decision[];
  pendingActionItems: ActionItem[];
  activeRepos: string[];
}
```

---

## 5. Especificación de Herramientas

### 5.1 Herramientas Git

#### `get_repo_context`
```
Entrada:
  - repo: string (nombre del repo)
  - limit: number = 20 (commits recientes a retornar)

Salida:
  - RepoContext (commits recientes, estadísticas, rama actual)
  
Caso de Uso:
  "Qué ha pasado en auth-service?"
  → Muestra últimos 10 commits, quién trabajó, rama actual
```

#### `get_file_history`
```
Entrada:
  - repo: string
  - filePath: string
  - limit: number = 20

Salida:
  - FileHistory (commits que tocaron este archivo)

Caso de Uso:
  "Quién tocó el middleware de auth?"
  → Muestra todos los commits, cuándo, por qué
```

#### `get_commit_info`
```
Entrada:
  - repo: string
  - hash: string (o "HEAD", "HEAD~1", etc)

Salida:
  - CommitInfo + diff completo (opcional)

Caso de Uso:
  "Dime sobre commit abc123"
  → Muestra autor, mensaje, archivos cambiados
```

#### `get_repo_stats`
```
Entrada:
  - repo: string
  - timeframe: "week" | "month" = "month"

Salida:
  - Commits por persona
  - Ramas activas
  - Top contributores

Caso de Uso:
  "Quién ha estado más activo en frontend este mes?"
```

#### `list_repos`
```
Entrada: (ninguna)

Salida:
  - Todos los repos descubiertos con metadatos

Caso de Uso:
  "Qué repos estamos trackeando?"
```

---

### 5.2 Herramientas Memory y Reuniones

#### `create_meeting_note`
```
Entrada:
  - vault: string
  - date: string (YYYY-MM-DD)
  - title: string
  - participants: string[] (del TEAM_MEMBERS)
  - decisions: string[]
  - actionItems: { task, owner, dueDate }[]
  - summary?: string

Salida:
  - Ruta de nota creada
  - Guardado en Memory

Proceso:
  1. Crear archivo .md en vault con template estructurado
  2. Parsear a schema MeetingEntry
  3. Guardar en Memory (claude-mem)
  4. Retornar confirmación + ID Memory

Caso de Uso:
  "Crear nota de reunión del standup de hoy"
  → Guarda en Obsidian + Memory
```

#### `query_memory`
```
Entrada:
  - query: string (búsqueda de texto libre)
  - filters?: {
      type?: "meeting" | "decision" | "action-item"
      author?: string
      from?: Date
      to?: Date
      repos?: string[]
    }

Salida:
  - MemoryQueryResult (entradas coincidentes)

Caso de Uso:
  "Qué decisiones tomamos sobre auth el mes pasado?"
  → Busca en Memory, retorna reuniones + decisiones
```

#### `get_team_context`
```
Entrada:
  - timeframe: "week" | "month"

Salida:
  - TeamContextSnapshot

Caso de Uso:
  "Qué ha pasado en el equipo este mes?"
  → Muestra quién hizo qué, qué se decidió, items pendientes
```

#### `list_action_items`
```
Entrada:
  - owner?: string (filtrar por persona)
  - status?: "pending" | "in-progress" | "completed"

Salida:
  - ActionItem[]

Caso de Uso:
  "Qué tengo que hacer?"
  → Muestra tareas pendientes de Alice
```

---

## 6. Ejemplos de Flujo de Trabajo

### Ejemplo 1: Resumen de Reunión (2026-04-15)

**Durante reunión:**
```
Claude: create_meeting_note
  vault: FACULTAD
  date: 2026-04-15
  title: "Decisión Sistema Auth"
  participants: [Alice, Bob]
  decisions:
    - "Usar OAuth2 con PKCE"
    - "HTTP-only secure cookies para tokens"
  actionItems:
    - { task: "Implementar OAuth2", owner: "Alice", dueDate: "2026-04-20" }
    - { task: "Revisar implementación", owner: "Bob", dueDate: "2026-04-22" }
```

**Después en Obsidian:**
- Nota creada en: `Inteligencia Artificial/2026-04-15-auth-decision.md`
- También guardada en Memory

**Una semana después, Bob quiere contexto:**
```
Claude: query_memory
  query: "auth oauth decision"
```
Retorna: MeetingEntry con todos los detalles, estado de items de acción

---

### Ejemplo 2: Estadísticas de Repo

```
Claude: get_repo_stats
  repo: "auth-service"
  timeframe: "month"
```

Retorna:
```
auth-service (últimos 30 días):
- Total commits: 47
- Alice: 23 commits
- Charlie: 18 commits
- Bob: 6 commits
- Ramas activas: main, feature/oauth, hotfix/token-bug
```

---

### Ejemplo 3: Snapshot de Contexto de Equipo

```
Claude: get_team_context
  timeframe: "month"
```

Retorna: Quién hizo qué, qué se decidió, qué está pending:
```
Resumen Abril 2026:
- 8 repos con 127 commits
- Top contributores: Alice (34), Charlie (28), Bob (20)
- Decisiones recientes: OAuth2, plan migración BD, versionado API
- Items de acción pendientes: 12 (8 en tiempo, 4 en riesgo)
```

---

## 7. Plan de Implementación

### Fase 1a: Foundation (Semana 1)
- [ ] Actualizar `config.ts` para multi-repo + equipo
- [ ] Crear clase wrapper `Memory`
- [ ] Agregar funciones utilidad git (exec git commands)
- [ ] Definir interfaces TypeScript

### Fase 1b: Herramientas Git (Semana 1-2)
- [ ] Implementar `get_repo_context`
- [ ] Implementar `get_file_history`, `get_commit_info`
- [ ] Implementar `get_repo_stats`
- [ ] Implementar `list_repos`

### Fase 1c: Herramientas Reuniones (Semana 2)
- [ ] Crear template de nota de reunión
- [ ] Implementar `create_meeting_note` (+ guardar a Memory)
- [ ] Implementar `query_memory`
- [ ] Implementar `get_team_context`

### Fase 1d: Polish (Semana 2-3)
- [ ] Pruebas de integración
- [ ] Manejo de errores
- [ ] Documentación + ejemplos

---

## 8. Dependencias y Setup

### Nuevas Dependencias
```json
{
  "simple-git": "^3.20.0",
  "@octokit/rest": "^20.0.0",
  "dotenv": "^16.0.0"
}
```

### Variables de Entorno
```bash
GITHUB_TOKEN=ghp_...        (token GitHub para descubrimiento de org)
GITHUB_ORG=nombre-empresa   (nombre de la organización)
MEMORY_API_KEY=...          (si claude-mem requiere auth explícita)
```

### Estructura de Archivos
```
src/
  ├── index.ts (servidor MCP principal)
  ├── config.ts (repos, equipo, vaults)
  ├── memory.ts (clase wrapper Memory)
  ├── git/
  │   ├── git-utils.ts (funciones exec git)
  │   ├── types.ts (CommitInfo, RepoContext, etc)
  │   └── repo-discovery.ts (descubrimiento GitHub org)
  ├── tools/
  │   ├── git-tools.ts (todas herramientas git)
  │   ├── memory-tools.ts (herramientas memory)
  │   └── meeting-tools.ts (herramientas reuniones)
  └── utils.ts
```

---

## 9. Criterios de Éxito (Fase 1)

- Se pueden leer commits recientes de múltiples repos
- Se pueden crear notas de reunión que se guardan auto a Memory
- Se puede buscar en Memory para encontrar decisiones + items de acción
- El equipo puede ver "qué ha pasado" con `get_team_context`
- Todas las herramientas manejan múltiples repos desde GitHub org
- 8 miembros de equipo configurados + visibles en items de acción

---

## 10. Preguntas Abiertas / Decisiones

- Git Caching: Cachear info de repo localmente o siempre fresco?
- Memory Limits: Límites en tamaño de búsqueda/frecuencia?
- Linking: Fase 2 - linkear automáticamente commits que implementan decisiones?
