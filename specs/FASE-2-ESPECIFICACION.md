# Especificación Fase 2: Auto-Linking + Búsqueda Avanzada + Persistencia Memory

**Estado:** Planificación  
**Timeline:** 1-2 sprints  
**Dependencias:** Phase 1 completado  
**Scope:** Linking inteligente, búsqueda avanzada, persistencia real en Memory

---

## 1. Descripción General

Fase 2 agrega capacidades de linking automático y búsqueda avanzada que conectan decisiones con su implementación en code. También integra persistencia real con claude-mem para que Memory sobreviva reinicio del proceso.

**Problema que resuelve:**
- Phase 1 registra decisiones pero no las conecta con commits que las implementan
- Memory es in-memory, se pierde al reiniciar
- Búsquedas son básicas (solo texto libre + filtros simples)

**Solución:**
- Análisis automático de commits para detectar qué decisión implementan
- Persistencia en claude-mem plugin
- Búsqueda full-text + filtros complejos + ranking por relevancia

---

## 2. Características Principales

### 2.1 Auto-Linking de Commits a Decisiones

**Nueva Herramienta:** `link_commit_to_decision`

```
Entrada:
  - repo: string
  - commitHash: string
  - decisionId: string (de Memory)

Salida:
  - Asociación guardada en Memory
  - Link bidireccional
```

**Proceso Automático (Background):**
```
Trigger: create_meeting_note o manualmente
Flujo:
  1. Extraer decisiones de la reunión
  2. Buscar commits posteriores en repos relacionados
  3. Usar heurísticas para detectar matches:
     - Palabras clave del título de commit contienen palabras de decisión
     - Fecha: commit después de reunión + dentro de N días
     - Archivos cambiados coinciden con contexto
  4. Crear linkage automático con score de confianza
  5. Guardar en Memory
```

**Data Model:**
```typescript
interface CommitDecisionLink {
  commitHash: string;
  commitAuthor: string;
  commitDate: Date;
  decisionId: string;
  decisionText: string;
  repo: string;
  confidenceScore: number; // 0-1, basado en heurísticas
  linkType: "implements" | "fixes" | "refactors" | "related";
  createdAt: Date;
  createdBy: "auto" | "manual";
}
```

**Ejemplos:**
```
Decision: "Usar OAuth2 con PKCE"
↓ (auto-link detecta)
Commits:
  - Bob: "Implement OAuth2 flow with PKCE" (score: 0.95)
  - Charlie: "Add PKCE validation" (score: 0.87)
  - Eve: "Add OAuth2 types" (score: 0.72)
```

### 2.2 Persistencia en Claude Memory

**Nueva Clase:** `MemoryPersistence`

```typescript
interface MemoryPersistence {
  save(entry: ContextEntry): Promise<string>;
  query(searchTerm: string, filters?): Promise<MemoryEntry[]>;
  update(entryId: string, data: Partial<ContextEntry>): Promise<void>;
  delete(entryId: string): Promise<void>;
}
```

**Implementación:**
- Usar claude-mem plugin API (via HTTP o IPC)
- Fallback a local storage si claude-mem no está disponible
- Sincronización periódica (cada 5 minutos)
- Caché local para performance

**Data Sync:**
```
Local MemoryClient (caché)
           ↓
    Persistencia wrapper
           ↓
    Claude-mem plugin
           ↓
Persistencia global (multi-sesión)
```

### 2.3 Búsqueda Avanzada

**Nueva Herramienta:** `advanced_search`

```
Entrada:
  - query: string (free text)
  - filters: {
      type: ["meeting", "decision", "action-item", "commit-link"][]
      author: string[]
      dateRange: { from, to }
      repos: string[]
      status: string[]
      tags: string[]
      linkedToCommit: boolean
      confidenceMin: number
    }
  - sort: "date" | "relevance" | "confidence"
  - limit: number

Salida:
  - Results con metadata y ranking
```

**Ranking por Relevancia:**
- TF-IDF en título + summary
- Recency boost (últimos 7 días +50%)
- Confidence score (para linked items)
- User engagement (veces que fue leído/querido)

**Ejemplos de Búsqueda:**
```
1. "oauth" + type: ["meeting", "decision"] 
   → Todas decisiones/reuniones sobre oauth

2. linkedToCommit: true + repo: "auth-service"
   → Decisiones implementadas en auth-service

3. status: "pending" + author: ["Alice"]
   → Items de acción pendientes de Alice

4. dateRange: [2026-04-01, 2026-04-30] + repo: ["frontend"]
   → Actividad de abril en frontend
```

### 2.4 Timeline View

**Nueva Herramienta:** `get_decision_timeline`

```
Entrada:
  - decisionId: string

Salida:
  - Línea de tiempo de:
    - Decisión (fecha, participantes)
    - Commits relacionados (con confianza)
    - Action items asociados
    - Feedback/updates
```

**Visualización Conceptual:**
```
2026-04-15 10:30 - DECISION: "Use OAuth2 with PKCE"
  ├─ Participants: Alice, Bob
  └─ Confidence: high

2026-04-15 14:00 - ACTION ITEM: Implement OAuth2 (Alice, due 2026-04-20)
  └─ Status: in-progress

2026-04-16 09:15 - COMMIT: "Implement OAuth2 flow" (Bob)
  ├─ Repo: auth-service
  ├─ Hash: abc123...
  └─ Confidence: 95%

2026-04-17 11:30 - COMMIT: "Add PKCE validation" (Charlie)
  ├─ Repo: auth-service
  └─ Confidence: 87%

2026-04-18 16:45 - ACTION UPDATE: In Progress (Bob)
```

---

## 3. Integración con Claude Memory (claude-mem)

### 3.1 API esperada de claude-mem

**Asumimos que claude-mem expone:**
```
POST /save
  { type, title, summary, data }
  → { id }

GET /query?q=...&filters=...
  → { results: [], totalCount }

GET /{id}
  → { entry }

PATCH /{id}
  { updates }
  → { updated }

DELETE /{id}
  → { success }
```

### 3.2 Schema de Almacenamiento

```typescript
interface MemoryStorageSchema {
  // Decisiones
  decisions: {
    id: string;
    meetingId: string;
    text: string;
    owner?: string;
    createdAt: Date;
    tags: string[];
    linkedCommits: CommitDecisionLink[];
  };

  // Meetings
  meetings: {
    id: string;
    date: Date;
    title: string;
    participants: string[];
    decisions: string[]; // decision IDs
    actionItems: string[]; // action item IDs
    summary: string;
  };

  // Action Items
  actionItems: {
    id: string;
    meetingId: string;
    task: string;
    owner: string;
    dueDate: Date;
    status: "pending" | "in-progress" | "completed";
    updates: { date, status, comment }[];
  };

  // Commit Links
  commitLinks: {
    id: string;
    decisionId: string;
    repo: string;
    commitHash: string;
    commitAuthor: string;
    commitDate: Date;
    linkType: string;
    confidenceScore: number;
    createdAt: Date;
    createdBy: "auto" | "manual";
  };
}
```

---

## 4. Herramientas Nuevas

### 4.1 `link_commit_to_decision` (Manual)

```
Entrada:
  - repo: string
  - commitHash: string
  - decisionId: string
  - linkType?: "implements" | "fixes" | "refactors"

Salida:
  - Link creado
```

**Uso:** Tech lead quiere linkear manualmente un commit que cree implementa una decisión

### 4.2 `auto_link_commits`

```
Entrada:
  - decisionId: string
  - repos?: string[] (si no, busca en todos)
  - timeframeAfterDecision?: number (días, default: 30)
  - confidenceThreshold?: number (0-1, default: 0.7)

Salida:
  - Commits encontrados y linkeados
  - Report con scores
```

**Uso:** Después de crear una reunión, ejecutar automáticamente

### 4.3 `advanced_search`

Ver sección 2.3

### 4.4 `get_decision_timeline`

Ver sección 2.4

### 4.5 `link_action_item_to_commit`

```
Entrada:
  - actionItemId: string
  - commitHash: string
  - repo: string

Salida:
  - Link creado
```

### 4.6 `get_decision_impact`

```
Entrada:
  - decisionId: string

Salida:
  - Impacto summary:
    - Commits relacionados: N
    - Archivos afectados: N
    - Repos impactados: [...]
    - Lines of code changed: N
    - Authors involved: N
```

### 4.7 `mark_decision_complete`

```
Entrada:
  - decisionId: string
  - completionDate?: Date

Salida:
  - Decision marcada como complete
```

---

## 5. Algoritmos de Heurística para Auto-Linking

### 5.1 Scoring de Matching

```typescript
function scoreCommitDecisionMatch(
  decision: Decision,
  commit: Commit,
  timeframeAfter: number
): number {
  let score = 0;

  // Semántica: palabras clave compartidas
  const decisionKeywords = extractKeywords(decision.text);
  const commitKeywords = extractKeywords(commit.message);
  const sharedKeywords = intersection(decisionKeywords, commitKeywords);
  score += (sharedKeywords.length / decisionKeywords.length) * 0.4;

  // Temporal: commit está dentro del timeframe
  const daysAfter = (commit.date - decision.date) / (1000 * 60 * 60 * 24);
  if (daysAfter > 0 && daysAfter <= timeframeAfter) {
    score += 0.3 * (1 - daysAfter / timeframeAfter);
  }

  // Contexto: archivos relacionados
  if (isRelevantRepo(decision.relatedRepos, commit.repo)) {
    score += 0.2;
  }

  // Participantes: implementador es participante de reunión
  if (decision.participants.includes(commit.author)) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}
```

### 5.2 Keywords Extraction

```
decision: "Usar OAuth2 con PKCE"
keywords: ["oauth2", "pkce", "auth", "security"]

commit: "Implement OAuth2 flow with PKCE for security"
keywords: ["implement", "oauth2", "flow", "pkce", "security"]

shared: ["oauth2", "pkce", "security"] → score: 3/4 = 0.75
```

---

## 6. Cambios a Phase 1 (Refactoring)

### 6.1 MemoryClient

**Actualizar:**
```typescript
// Phase 1 (in-memory)
class MemoryClient { ... }

// Phase 2 (con persistencia)
class MemoryClient {
  private persistence: MemoryPersistence; // Nueva
  async save(entry): Promise<string> {
    const id = await this.persistence.save(entry);
    return id;
  }
}
```

### 6.2 Estructura de Datos

**Agregar a ContextEntry:**
```typescript
interface ContextEntry {
  // ... fields existentes
  linkedCommits?: CommitDecisionLink[];
  tags?: string[];
  linkedActionItems?: string[];
  impactSummary?: {
    filesChanged: number;
    reposImpacted: string[];
    authorsInvolved: string[];
  };
}
```

### 6.3 Meeting Note Template

**Agregar sección:**
```markdown
## Implementación
- Links a commits que implementan esta decisión
- (Se rellenará automáticamente después de linkeado)
```

---

## 7. Flujo de Trabajo Phase 2

**Después de reunión:**
```
1. create_meeting_note(...)
   ↓
2. [AUTOMÁTICO] auto_link_commits(decisionId)
   → Busca commits que implementen
   → Crea links con confidence score
   ↓
3. Meeting note se actualiza con links
   → "Implementación" section + commits
   ↓
4. Team members pueden:
   - Ver timeline de decisión → implementation
   - Buscar decisiones → encuentra commits relacionados
   - Marcar action items como complete
```

---

## 8. Casos de Uso Phase 2

### Caso 1: "Qué decisiones se implementaron en auth-service?"
```
advanced_search(
  query: "",
  filters: {
    repos: ["auth-service"],
    linkedToCommit: true,
    type: ["decision"]
  }
)
→ Todas decisiones implementadas en ese repo
```

### Caso 2: "Alice completó su task de OAuth2?"
```
get_decision_timeline(decisionId)
→ Muestra: decisión → action items → commits → completado
```

### Caso 3: "Cuántos commits afectó la decisión de refactoring?"
```
get_decision_impact(decisionId)
→ { commits: 15, authors: 3, repos: 2, linesChanged: 2341 }
```

### Caso 4: "Qué decisiones del mes pasado todavía no se implementan?"
```
advanced_search(
  query: "",
  filters: {
    dateRange: [2026-03-15, 2026-04-15],
    linkedToCommit: false,
    type: ["decision"]
  }
)
→ Decisiones sin implementación
```

---

## 9. Riesgos y Mitigaciones

### Riesgo: False Positives en Auto-Linking
**Mitigación:**
- Confidence score threshold (default: 0.7)
- Manual review option
- User can delete incorrect links

### Riesgo: Performance de Búsqueda
**Mitigación:**
- Índice en memoria para queries frecuentes
- Paginación en resultados
- Caché de resultados populares

### Riesgo: Sincronización Memory
**Mitigación:**
- Transaccional writes
- Retry logic
- Local queue si offline

### Riesgo: Memory API Changes
**Mitigación:**
- Abstraction layer (MemoryPersistence interface)
- Versioning
- Fallback a in-memory

---

## 10. Métricas de Éxito Phase 2

- Linking accuracy > 85%
- 90% de decisiones con al menos 1 commit linked en 30 días
- Search response time < 500ms
- Memory persistence > 99% uptime
- Timeline view reduces "qué pasó?" questions by 50%

---

## 11. Plan de Implementación

### 11a: Foundation (Semana 1)
- [ ] Integrar con claude-mem plugin
- [ ] Crear MemoryPersistence interface
- [ ] Implementar sync local↔memory

### 11b: Auto-Linking (Semana 1-2)
- [ ] Heurística de scoring
- [ ] auto_link_commits tool
- [ ] link_commit_to_decision tool
- [ ] Background linking task

### 11c: Búsqueda Avanzada (Semana 2)
- [ ] advanced_search tool
- [ ] Full-text indexing
- [ ] Ranking algorithm

### 11d: Timeline & Polish (Semana 2-3)
- [ ] get_decision_timeline
- [ ] get_decision_impact
- [ ] Tests + docs
- [ ] Update EXAMPLES.md

---

## 12. Dependencias Nuevas (opcionales)

- `natural` (para NLP keyword extraction)
- `lunr` (para full-text search indexing)
