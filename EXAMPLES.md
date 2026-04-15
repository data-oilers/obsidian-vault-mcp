# Ejemplos de Uso - MCP Obsidian Team Context

## Escenario 1: Reunión de Planning

**Situación:** Terminó la reunión de planning del sprint. Alice necesita registrar las decisiones y asignar items de acción.

```
Herramienta: create_meeting_note

Inputs:
  vault: "FACULTAD"
  date: "2026-04-15"
  title: "Sprint Planning - Authentication Refactor"
  participants: ["Alice", "Bob", "Charlie"]
  summary: |
    Discutimos la refactorización del sistema de autenticación.
    El equipo decidió usar OAuth2 con PKCE para mayor seguridad.
    Bob se enfocará en el backend, Charlie en el frontend.
  decisions:
    - "Implementar OAuth2 con PKCE en lugar de sessions tradicionales"
    - "Usar HTTP-only secure cookies para almacenar tokens"
    - "Agregar MFA en una segunda fase"
  actionItems:
    - task: "Diseñar flujo OAuth2 y documentar decisiones"
      owner: "Alice"
      dueDate: "2026-04-17"
    - task: "Implementar servidor OAuth2 (backend)"
      owner: "Bob"
      dueDate: "2026-04-22"
    - task: "Implementar login flow (frontend)"
      owner: "Charlie"
      dueDate: "2026-04-22"
    - task: "Revisar especificación de seguridad"
      owner: "Alice"
      dueDate: "2026-04-20"
  relatedRepos:
    - "auth-service"
    - "frontend"
    - "backend"

Output:
{
  "success": true,
  "notePath": "Reuniones/2026-04-15-sprint-planning-authentication-refactor.md",
  "message": "Nota de reunión creada y guardada en Memory"
}
```

**Resultado:**
- Nota creada en Obsidian: `FACULTAD/Reuniones/2026-04-15-sprint-planning...md`
- Entrada guardada en Memory con todas las decisiones
- Items de acción registrados con propietarios y fechas vencimiento

---

## Escenario 2: Revisar Contexto del Equipo

**Situación:** Es lunes por la mañana. El tech lead quiere entender qué pasó la semana pasada.

```
Herramienta: get_team_context

Inputs:
  timeframe: "week"

Output:
{
  "timeframe": "week",
  "summary": "Actividad de equipo de los últimos 7 días",
  "contributors": [
    {
      "name": "Bob",
      "commits": 12,
      "activity": "12 eventos registrados"
    },
    {
      "name": "Charlie",
      "commits": 8,
      "activity": "8 eventos registrados"
    },
    {
      "name": "Alice",
      "commits": 5,
      "activity": "5 eventos registrados"
    }
  ],
  "recentDecisions": [
    "Usar OAuth2 con PKCE",
    "HTTP-only secure cookies"
  ],
  "pendingActionItems": [
    {
      "task": "Implementar servidor OAuth2",
      "owner": "Bob",
      "dueDate": "2026-04-22",
      "status": "in-progress"
    }
  ],
  "activeRepos": ["auth-service", "frontend", "backend"]
}
```

**Análisis:**
- Bob fue muy activo (12 commits) - probablemente trabajando en OAuth2
- Hay 3 decisiones importantes registradas
- 1 item de acción activo, en timeline

---

## Escenario 3: Buscar en Memory

**Situación:** Bob necesita recordar los detalles sobre la decisión de OAuth2 que tomaron hace una semana.

```
Herramienta: query_memory

Inputs:
  query: "oauth2 pkce security"
  type: "meeting"
  from: "2026-04-01"
  to: "2026-04-15"

Output:
{
  "totalCount": 2,
  "timeRange": {
    "from": "2026-04-01T00:00:00Z",
    "to": "2026-04-15T23:59:59Z"
  },
  "entries": [
    {
      "id": "meeting-1713180600000-abc123",
      "timestamp": "2026-04-15T10:30:00Z",
      "type": "meeting",
      "title": "Sprint Planning - Authentication Refactor",
      "summary": "Discutimos refactorización... OAuth2 con PKCE...",
      "contributors": ["Alice", "Bob", "Charlie"],
      "relatedRepos": ["auth-service", "frontend", "backend"]
    },
    {
      "id": "meeting-1713086400000-def456",
      "timestamp": "2026-04-14T10:00:00Z",
      "type": "meeting",
      "title": "Security Review - OAuth2",
      "summary": "Revisión de seguridad de OAuth2...",
      "contributors": ["Alice", "Henry"],
      "relatedRepos": ["auth-service"]
    }
  ]
}
```

**Uso:**
Bob ahora tiene dos reuniones que hablan sobre OAuth2. Puede abrir ambas en Obsidian para revisar los detalles completos.

---

## Escenario 4: Ver Estadísticas de un Repo

**Situación:** Alice quiere saber quién ha estado tocando el auth-service últimamente.

```
Herramienta: get_repo_stats

Inputs:
  repo: "auth-service"
  timeframe: "month"

Output:
{
  "name": "auth-service",
  "commitsByAuthor": {
    "Bob": 23,
    "Alice": 15,
    "Charlie": 8,
    "Eve": 3
  },
  "activeBranches": [
    "main",
    "feature/oauth2-backend",
    "feature/token-refresh",
    "hotfix/session-bug"
  ],
  "lastCommitDate": "2026-04-15T14:30:00Z"
}
```

**Análisis:**
- Bob ha sido el principal contributor (23 commits)
- Hay 4 ramas activas, probablemente relacionadas con OAuth2
- Último commit hace pocas horas

---

## Escenario 5: Revisar Histórico de un Archivo

**Situación:** Charlie quiere ver todo lo que ha pasado con el archivo de autenticación en el frontend.

```
Herramienta: get_file_history

Inputs:
  repo: "frontend"
  filePath: "src/auth/OAuth2Provider.tsx"
  limit: 10

Output:
{
  "filePath": "src/auth/OAuth2Provider.tsx",
  "commits": [
    {
      "hash": "abc123...",
      "author": "Charlie",
      "date": "2026-04-15T14:20:00Z",
      "message": "Fix PKCE state validation",
      "filesChanged": ["src/auth/OAuth2Provider.tsx"]
    },
    {
      "hash": "def456...",
      "author": "Charlie",
      "date": "2026-04-14T10:15:00Z",
      "message": "Implement OAuth2 login flow with PKCE",
      "filesChanged": [
        "src/auth/OAuth2Provider.tsx",
        "src/types/auth.ts",
        "tests/auth.test.tsx"
      ]
    },
    {
      "hash": "ghi789...",
      "author": "Bob",
      "date": "2026-04-12T09:45:00Z",
      "message": "Add OAuth2 types and interfaces",
      "filesChanged": ["src/types/auth.ts"]
    }
  ]
}
```

**Interpretación:**
- Archivo creado por Bob (12 abril)
- Charlie lo ha tocado 2 veces (14 y 15 de abril)
- Último cambio fue fix de validación de state

---

## Escenario 6: Items de Acción Pendientes

**Situación:** Es jueves. Alice quiere ver sus tasks pendientes antes del fin de semana.

```
Herramienta: list_action_items

Inputs:
  owner: "Alice"
  status: "pending"

Output:
{
  "totalCount": 2,
  "items": [
    {
      "task": "Revisar especificación de seguridad",
      "owner": "Alice",
      "dueDate": "2026-04-20",
      "status": "pending",
      "relatedIssue": null
    },
    {
      "task": "Aprobar PR de migración a OAuth2",
      "owner": "Alice",
      "dueDate": "2026-04-19",
      "status": "pending",
      "relatedIssue": "#145"
    }
  ]
}
```

**Acción:**
Alice ve que tiene 2 items pendientes, uno vence mañana (19). Puede priorizarlos.

---

## Escenario 7: Contexto de un Commit Específico

**Situación:** En un code review, Charlie pregunta por qué cambió cierta lógica. Alice quiere ver el commit que lo hizo.

```
Herramienta: get_commit_info

Inputs:
  repo: "auth-service"
  hash: "abc123def456ghi789..."

Output:
{
  "hash": "abc123def456ghi789...",
  "author": "Bob",
  "date": "2026-04-14T11:30:00Z",
  "message": "Fix token refresh race condition\n\nWhen multiple requests happened simultaneously,\nthe token was refreshed multiple times, causing\nlogin loops. Now we use a mutex pattern.",
  "filesChanged": [
    "src/auth/token-manager.ts",
    "src/auth/token-manager.test.ts",
    "docs/token-refresh.md"
  ]
}
```

**Resultado:**
Charlie ahora entiende el contexto detrás del cambio. Bob explicó bien por qué hizo el fix.

---

## Escenario 8: Monitoreo Continuo

**Situación:** Tech lead quiere mantener un "pulse" del equipo cada semana.

```
Cada lunes:
  1. Ejecutar: get_team_context(timeframe: "week")
  2. Crear nota en Obsidian con resumen
  3. Buscar en Memory nuevas decisiones: query_memory(from: last_monday)
  4. Revisar repos activos: get_repo_stats para cada repo
  5. Identificar items vencidos: list_action_items()

Resultado:
  - Dashboard semanal del equipo
  - Contexto completo de actividad
  - Alertas de items vencidos
```

---

## Flujo de Trabajo Ideal

1. **Después de reunión:** crear_meeting_note
2. **Durante sprint:** get_repo_context y get_file_history para reviewers
3. **Standups:** list_action_items para status
4. **Retrospectivas:** get_team_context(timeframe: "month")
5. **Búsquedas:** query_memory para encontrar decisiones pasadas
6. **Auditoría:** get_commit_info para entender cambios

---

## Pro Tips

1. **Nombres exactos:** Los participantes y owners deben ser nombres exactos (Alice, no alice)

2. **Fechas:** Siempre ISO format YYYY-MM-DD

3. **Búsqueda en Memory:** Usa términos amplios primero ("oauth") luego narrow down con filters

4. **Repos:** Usa list_repos() para ver los nombres exactos si no los recuerdas

5. **Integración:** Crea notas de reunión inmediatamente después de terminar - Memory es más útil si es timely
