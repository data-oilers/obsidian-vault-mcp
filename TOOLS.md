# Referencia de Herramientas MCP

## Git Tools

### get_repo_context

Obtener contexto reciente de un repositorio (commits, estadísticas, rama actual).

**Parámetros:**
- `repo` (string, requerido): Nombre del repositorio
- `limit` (number, opcional, default: 20): Número de commits recientes a retornar

**Retorna:**
```json
{
  "name": "auth-service",
  "recentCommits": [
    {
      "hash": "abc123...",
      "author": "Alice",
      "date": "2026-04-15T10:30:00Z",
      "message": "Add OAuth2 flow",
      "filesChanged": ["src/auth/oauth.ts"]
    }
  ],
  "currentBranch": "main",
  "stats": {
    "commitsThisMonth": 47,
    "activeAuthors": ["Alice", "Charlie"],
    "commitsByAuthor": {
      "Alice": 23,
      "Charlie": 18,
      "Bob": 6
    }
  },
  "lastUpdated": "2026-04-15T14:20:00Z"
}
```

**Casos de Uso:**
- "Qué ha pasado en el repo auth-service?"
- "Quién está trabajando actualmente?"
- "Cuál es la rama actual?"

---

### get_file_history

Obtener histórico de commits de un archivo específico.

**Parámetros:**
- `repo` (string, requerido): Nombre del repositorio
- `filePath` (string, requerido): Ruta relativa del archivo en el repo (ej: "src/auth/oauth.ts")
- `limit` (number, opcional, default: 20): Número de commits a retornar

**Retorna:**
```json
{
  "filePath": "src/auth/oauth.ts",
  "commits": [
    {
      "hash": "abc123...",
      "author": "Alice",
      "date": "2026-04-15T10:30:00Z",
      "message": "Fix token refresh logic",
      "filesChanged": ["src/auth/oauth.ts"]
    }
  ]
}
```

**Casos de Uso:**
- "Quién ha tocado el archivo de autenticación?"
- "Cuál fue el último cambio en el middleware?"
- "Histórico de cambios en este archivo"

---

### get_commit_info

Obtener información detallada de un commit específico.

**Parámetros:**
- `repo` (string, requerido): Nombre del repositorio
- `hash` (string, requerido): Hash del commit o referencia (ej: "abc123...", "HEAD", "HEAD~1")

**Retorna:**
```json
{
  "hash": "abc123def456...",
  "author": "Alice",
  "date": "2026-04-15T10:30:00Z",
  "message": "Add OAuth2 flow implementation\n\nImplements PKCE for security.",
  "filesChanged": [
    "src/auth/oauth.ts",
    "src/auth/token.ts",
    "tests/auth.test.ts"
  ]
}
```

**Casos de Uso:**
- "Dime qué cambios hizo Alice en el commit abc123"
- "Quién hizo el último cambio?"
- "Qué archivos se tocaron en este commit?"

---

### get_repo_stats

Obtener estadísticas de commits por autor (último mes/semana).

**Parámetros:**
- `repo` (string, requerido): Nombre del repositorio
- `timeframe` (enum: "week" | "month", opcional, default: "month"): Período de tiempo

**Retorna:**
```json
{
  "name": "auth-service",
  "commitsByAuthor": {
    "Alice": 23,
    "Charlie": 18,
    "Bob": 6
  },
  "activeBranches": [
    "main",
    "feature/oauth",
    "hotfix/token-bug"
  ],
  "lastCommitDate": "2026-04-15T14:20:00Z"
}
```

**Casos de Uso:**
- "Quién ha sido más activo en frontend este mes?"
- "Qué ramas están activas?"
- "Estadísticas de actividad semanal"

---

### list_repos

Listar todos los repositorios siendo trackeados.

**Parámetros:**
(ninguno)

**Retorna:**
```json
{
  "total": 8,
  "repos": [
    {
      "name": "auth-service",
      "url": "https://github.com/company/auth-service",
      "org": "company",
      "localPath": "/Users/user/repos/auth-service"
    }
  ]
}
```

**Casos de Uso:**
- "Qué repos estamos trackeando?"
- "Dónde están clonados los repos?"

---

## Meeting & Memory Tools

### create_meeting_note

Crear una nota de reunión estructurada que se guarda automáticamente en Memory.

**Parámetros:**
- `vault` (enum: "FACULTAD" | "DATAOILERS" | "PROYECTOS", requerido): Vault destino
- `date` (string, requerido): Fecha de la reunión (YYYY-MM-DD)
- `title` (string, requerido): Título de la reunión
- `participants` (array de strings, requerido): Participantes (nombres válidos del equipo)
- `decisions` (array de strings, requerido): Decisiones tomadas
- `actionItems` (array, requerido): Items de acción
  - `task` (string): Descripción de la tarea
  - `owner` (string): Responsable (nombre del equipo)
  - `dueDate` (string): Fecha de vencimiento (YYYY-MM-DD)
- `summary` (string, opcional): Resumen de la reunión
- `relatedRepos` (array de strings, opcional): Repos relacionados

**Retorna:**
```json
{
  "success": true,
  "notePath": "Reuniones/2026-04-15-auth-system-decision.md",
  "fullPath": "/Users/user/FACULTAD/Reuniones/2026-04-15-auth-system-decision.md",
  "message": "Nota de reunión creada y guardada en Memory"
}
```

**Nota:** Los participantes deben ser nombres válidos del TEAM_MEMBERS. Si ingresas un nombre inválido, obtendrás un error.

**Casos de Uso:**
- "Registrar decisión de la reunión de hoy"
- "Guardar items de acción de standup"
- "Documentar decisión arquitectónica"

---

### query_memory

Buscar en Memory por decisiones, reuniones, items de acción.

**Parámetros:**
- `query` (string, requerido): Búsqueda de texto libre
- `type` (enum: "meeting" | "decision" | "action-item" | "context", opcional): Filtrar por tipo
- `author` (string, opcional): Filtrar por autor/participante
- `from` (string, opcional): Fecha de inicio (YYYY-MM-DD)
- `to` (string, opcional): Fecha de fin (YYYY-MM-DD)
- `repos` (array de strings, opcional): Filtrar por repositorios

**Retorna:**
```json
{
  "totalCount": 3,
  "timeRange": {
    "from": "2026-03-15T00:00:00Z",
    "to": "2026-04-15T23:59:59Z"
  },
  "entries": [
    {
      "id": "entry-1713180600000...",
      "timestamp": "2026-04-15T10:30:00Z",
      "type": "meeting",
      "title": "Auth System Decision",
      "summary": "Decidimos usar OAuth2 con PKCE...",
      "contributors": ["Alice", "Bob"],
      "relatedRepos": ["auth-service", "frontend"]
    }
  ]
}
```

**Casos de Uso:**
- "Qué decisiones tomamos sobre auth?"
- "Búsqueda: decisiones de arquitectura"
- "Qué reuniones tuvo Alice el mes pasado?"

---

### get_team_context

Obtener snapshot del contexto del equipo (últimas semana/mes).

**Parámetros:**
- `timeframe` (enum: "week" | "month", opcional, default: "month"): Período de tiempo

**Retorna:**
```json
{
  "timeframe": "month",
  "summary": "Actividad de equipo de los últimos 30 días",
  "contributors": [
    {
      "name": "Alice",
      "commits": 34,
      "activity": "34 eventos registrados"
    },
    {
      "name": "Charlie",
      "commits": 28,
      "activity": "28 eventos registrados"
    }
  ],
  "recentDecisions": [],
  "pendingActionItems": [],
  "activeRepos": ["auth-service", "frontend", "backend"]
}
```

**Casos de Uso:**
- "Resumen de lo que pasó este mes"
- "Quién trabajó en qué?"
- "Decisiones recientes del equipo"

---

### list_action_items

Listar items de acción pendientes.

**Parámetros:**
- `owner` (string, opcional): Filtrar por propietario (nombre del equipo)
- `status` (enum: "pending" | "in-progress" | "completed", opcional): Filtrar por estado

**Retorna:**
```json
{
  "totalCount": 3,
  "items": [
    {
      "task": "Implement OAuth2",
      "owner": "Alice",
      "dueDate": "2026-04-20",
      "status": "in-progress",
      "relatedIssue": "#42"
    }
  ]
}
```

**Casos de Uso:**
- "Mis tareas pendientes" (usar owner: "Alice")
- "Qué está vencido?"
- "Items en progreso del equipo"

---

## Obsidian Tools

### create_note

Crear una nueva nota con template estructurado.

**Parámetros:**
- `vault` (enum, requerido): Vault destino
- `title` (string, requerido): Título
- `content` (string, requerido): Contenido principal
- `subject` (string, opcional): Materia/carpeta
- `type` (enum, default: "general"): Tipo de template
- Fields específicos por tipo (key_concepts, definition, examples, etc.)

---

### read_note

Leer el contenido de una nota existente.

**Parámetros:**
- `vault` (enum, requerido)
- `path` (string, requerido): Ruta relativa (ej: "Inteligencia Artificial/6-4-26.md")

---

### search_notes

Buscar notas por contenido.

**Parámetros:**
- `vault` (enum, requerido)
- `query` (string, requerido): Texto a buscar

---

### append_to_note

Agregar contenido a una nota.

**Parámetros:**
- `vault` (enum, requerido)
- `path` (string, requerido)
- `content` (string, requerido)
- `section` (string, opcional): Heading específico

---

### update_note

Reescribir completamente una nota.

**Parámetros:**
- `vault` (enum, requerido)
- `path` (string, requerido)
- `content` (string, requerido): Nuevo contenido completo

---

### list_subjects

Listar materias/carpetas de un vault.

**Parámetros:**
- `vault` (enum, requerido)

---

## Notas Importantes

1. **Team Members Válidos:**
   Los parámetros `participants` y `owner` deben ser nombres válidos de TEAM_MEMBERS:
   - Alice, Bob, Charlie, Diana, Eve, Frank, Grace, Henry

2. **Fechas:**
   Siempre en formato ISO (YYYY-MM-DD)

3. **Rutas de Archivos:**
   Usar rutas relativas al vault (ej: "Reuniones/2026-04-15-auth.md")

4. **Memory:**
   Actualmente usa almacenamiento en memoria. Phase 2 integrará persistencia real con claude-mem.
