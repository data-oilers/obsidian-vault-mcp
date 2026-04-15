# Roadmap MCP Obsidian Team Context

## Visión General

Sistema de contexto compartido para equipos que integra Obsidian vaults, repositorios Git múltiples y Claude Memory en una única plataforma de conocimiento.

---

## Phase 1: MVP Contexto Git + Memory Básico

**Status:** COMPLETADO  
**Duración:** 2 sprints  
**Entregables:** 9 herramientas MCP

### Herramientas Git (5)

- `get_repo_context` - Contexto reciente (commits, estadísticas, rama)
- `get_file_history` - Histórico de archivo
- `get_commit_info` - Detalles de commit específico
- `get_repo_stats` - Estadísticas por autor (mes/semana)
- `list_repos` - Listar repos trackeados

### Herramientas Meeting & Memory (4)

- `create_meeting_note` - Crear nota + guardar a Memory
- `query_memory` - Buscar en Memory
- `get_team_context` - Snapshot del equipo
- `list_action_items` - Items de acción pendientes

### Infraestructura

- GitHub org auto-discovery
- 8 team members preconfigurables
- MemoryClient (in-memory)
- Git utilities

### Documentación

- FASE-1-ESPECIFICACION.md (español)
- SETUP.md
- TOOLS.md
- EXAMPLES.md

---

## Phase 2: Auto-Linking + Búsqueda Avanzada + Persistencia

**Status:** PLANIFICADO  
**Duración:** 1-2 sprints  
**Dependencia:** Phase 1  
**Scope:** Linking inteligente, búsqueda avanzada, Memory persistente

### Nuevas Herramientas (7)

#### Auto-Linking
- `link_commit_to_decision` - Linkear manualmente commit → decision
- `auto_link_commits` - Detectar automáticamente commits que implementan decisiones
- `link_action_item_to_commit` - Linkear action item → commit
- `mark_decision_complete` - Marcar decision como completa

#### Búsqueda & Análisis
- `advanced_search` - Búsqueda full-text con filtros complejos + ranking
- `get_decision_timeline` - Timeline de decision (reunión → commits → completado)
- `get_decision_impact` - Impacto de una decision (repos, archivos, personas)

### Características

#### Auto-Linking Inteligente
```
Decision: "Usar OAuth2 con PKCE"
↓ (detección automática)
Commits:
  - Bob: "Implement OAuth2 flow" (95% confianza)
  - Charlie: "Add PKCE validation" (87% confianza)
```

**Heurísticas:**
- Similitud semántica (keywords)
- Temporal (dentro de N días post-decisión)
- Contexto (archivos, repos relacionados)
- Participantes (implementador es participante)

#### Búsqueda Avanzada
```
Filtros: tipo, autor, fecha, repos, estado, tags, linking
Ranking: relevancia (TF-IDF) + recency + confianza
Salida: Resultados ordenados + metadata
```

#### Persistencia Claude Memory
```
In-memory cache ↔ Claude-mem plugin ↔ Global persistence
Sincronización cada 5 min
Fallback a local si memoria no disponible
```

### Data Models

Nuevos campos:
- `CommitDecisionLink` - Conexión entre commits y decisiones
- `linkType` - "implements", "fixes", "refactors"
- `confidenceScore` - 0-1 score de confianza
- Agregados a `ContextEntry`:
  - linkedCommits
  - tags
  - linkedActionItems
  - impactSummary

### Documentación Phase 2

- FASE-2-ESPECIFICACION.md (español)
- Actualizar EXAMPLES.md con nuevos casos
- Guía de auto-linking heurísticas

---

## Phase 3: Knowledge Graph + Visualización

**Status:** PLANIFICADO  
**Duración:** 1-2 sprints  
**Dependencia:** Phase 2  
**Scope:** Grafo de conocimiento, análisis, visualización

### Nuevas Herramientas (6)

#### Visualización
- `get_knowledge_graph` - Grafo completo (JSON, Mermaid, SVG)

#### Análisis
- `analyze_node_impact` - Impacto de un nodo (personas, repos, archivos)
- `find_communities` - Detectar clusters de trabajo relacionados
- `get_node_path` - Camino entre dos entidades + alternativas
- `get_person_network` - Red de relaciones de una persona
- `get_repo_decision_history` - Timeline de decisiones en un repo

### Características

#### Knowledge Graph
```
Nodos: Decisiones, Reuniones, Items de acción, Commits, Personas, Repos, Topics
Edges: implementa, depende-de, participa, posee, afecta, relacionado-con
```

#### Análisis
- **Centralidad:** Identifica nodos "hub" críticos
- **Community Detection:** Agrupa nodos relacionados automáticamente
- **Path Analysis:** Encuentra cómo se conectan entidades
- **Impact Analysis:** Cuantifica alcance de un nodo

#### Visualización
```
Mermaid diagrams (Markdown)
  ├─ Decision Flow (dependencias)
  ├─ Implementation Timeline
  └─ Person Network

SVG graphs (força dirigida)
  └─ Grafo interactivo posicionado

JSON export (D3.js, vis.js)
  └─ Para consumo por herramientas externas
```

### Data Models

Nueva clase:
```typescript
class KnowledgeGraph {
  nodes: Map<id, GraphNode>
  edges: Map<id, GraphEdge>
  
  // Análisis
  getConnectedNodes(id, depth): GraphNode[]
  getImpactAnalysis(id): ImpactAnalysis
  toMermaid(): string
  toSVG(): string
  toJSON(): object
}
```

### Documentación Phase 3

- FASE-3-ESPECIFICACION.md (español)
- Guía de interpretación de grafos
- Ejemplos de visualizaciones

---

## Roadmap Temporal

```
Ahora (Semana 1)
  └─ Phase 1: COMPLETADO

Semana 2-3
  └─ Phase 2: Auto-linking + Memory persistente

Semana 4-5
  └─ Phase 3: Knowledge Graph + Visualización

Post-Phase 3 (Roadmap Futuro)
  ├─ Neo4j integration (grafos grandes)
  ├─ Visualización 3D
  ├─ Real-time collaboration
  ├─ ML auto-tagging
  └─ Recomendaciones basadas en patterns
```

---

## Stack Técnico

### Phase 1 (Actual)
```
TypeScript + Node.js
MCP SDK
Zod (validación)
execSync (git)
Obsidian (vaults)
```

### Phase 2 (Agregar)
```
natural (NLP keyword extraction)
lunr (full-text search)
claude-mem plugin
```

### Phase 3 (Agregar)
```
graphology (grafo lib)
graphology-metrics
graphology-communities-louvain
mermaid (already in)
```

---

## Success Criteria por Phase

### Phase 1: MVP
- 9 herramientas funcionales
- Compilación sin errores
- Documentación completa
- Team context searchable

### Phase 2: Intelligence
- 85%+ accuracy en auto-linking
- 90% de decisiones con commits linked en 30 días
- Search response < 500ms
- Memory persistence > 99% uptime

### Phase 3: Visualization
- Grafo 100% reconstruible desde Memory
- Community detection > 90% accuracy
- Path finding < 100ms (< 1000 nodos)
- Visualizaciones renderizables en Markdown

---

## Consideraciones Arquitectónicas

### Escalabilidad
- Phase 1-2: In-memory + caché local OK para < 10k entries
- Phase 3: Neo4j para > 100k nodos + análisis complejos

### Performance
- Caché agresivo de queries populares
- Índices en memory para búsquedas
- Serialización incremental de grafo

### Reliability
- Transactional writes a Memory
- Retry logic + exponential backoff
- Local queue para offline operation
- Versioning de schema

### Extensibilidad
- MemoryPersistence interface (fácil cambiar backend)
- KnowledgeGraph plugin system (new edge types)
- Tool registry (fácil agregar herramientas)

---

## Open Questions

### Phase 2
- Threshold de confianza para auto-linking (default 0.7)?
- Algoritmo de NLP: regexes vs trained model?
- Sincronización frecuencia a Memory (5 min, 1 min, real-time)?

### Phase 3
- Algoritmo de community detection: Louvain vs Girvan-Newman?
- Límite de nodos antes de agregar Neo4j? (1000? 10000?)
- SVG rendering: server-side vs client-side?

### General
- Cuántos repos máximo a trackear? (10? 100? 1000?)
- Retención de datos: indefinido o rolling window?
- Permisos: todos los team members ven todo?

---

## Feedback Loop

### Métricas a Monitorear

**Phase 1:**
- Búsquedas por día
- Tamaño promedio de resultados
- Reuniones creadas por semana
- Action items completion rate

**Phase 2:**
- Auto-linking accuracy (manual review)
- False positive rate
- Search latency percentiles
- Memory persistence sync errors

**Phase 3:**
- Grafo construction time
- Query response times
- Visualization render time
- User engagement con grafo

### Retroalimentación del Usuario

Post-Phase 1: Validación con 8 team members
Post-Phase 2: Testing de auto-linking en casos reales
Post-Phase 3: A/B testing de visualizaciones

---

## Notas Importantes

- **Documentación:** Todos los specs y documentación en ESPAÑOL
- **Sin Emojis:** En código y documentación
- **Enfoque:** Spec Driven Development - specs completos antes de codificar
- **Equipo:** 8 personas, múltiples repos, empresa con GitHub org
- **Memory:** Claude-mem plugin como backend de persistencia
