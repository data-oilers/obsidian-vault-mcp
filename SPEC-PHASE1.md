# Spec Phase 1: MCP Obsidian Multi-Repo + Team Context

**Status:** Draft  
**Target Timeline:** 2 sprints  
**Team Size:** 8 people  
**Scope:** Multi-repo discovery + Git Context + Memory integration

---

## 1. Overview

This MCP server integrates Obsidian, Git repositories, and Claude Memory to provide a **shared team context** across an organization. 

**Key Problem:** 8-person team working across multiple repos → hard to track who did what, what was decided, pending action items.

**Solution:** Centralized context via:
- Git history + stats from multiple repos
- Meeting notes with decisions & action items
- Claude Memory for searchable team knowledge base

---

## 2. Architecture

```
Claude Memory (claude-mem plugin)
         ↓ (save/query)
┌─────────────────────────────────┐
│   MCP Server                    │
│   - Git Tools                   │
│   - Meeting Tools               │
│   - Memory Wrapper              │
└──────────┬──────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Data Sources                  │
│   - GitHub Org Repos (N repos)  │
│   - Obsidian Vaults (3 vaults)  │
│   - Local git repos             │
└─────────────────────────────────┘
```

---

## 3. Configuration

### 3.1 Multi-Repo Discovery

Two modes:

**Mode A: GitHub Organization**
```typescript
// config.ts
export const GIT_CONFIG = {
  mode: "github-org",
  org: "companyname",         // GitHub org
  githubToken: process.env.GITHUB_TOKEN,
  cacheDir: "~/.claude/git-cache",
  refreshInterval: 3600000,   // 1 hour
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

**Mode B: Manual Repos**
```typescript
export const REPOS = {
  "auth-service": { path: "/path/to/auth-service", org: "company" },
  "frontend": { path: "/path/to/frontend", org: "company" },
  // ...
};
```

### 3.2 Team Config

```typescript
export const TEAM_MEMBERS: TeamMember[] = [
  { name: "Alice", email: "alice@company.com", role: "Backend Lead" },
  { name: "Bob", email: "bob@company.com", role: "Frontend" },
  // ... 8 total
];
```

---

## 4. Data Models

### 4.1 Git Context

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

### 4.2 Meeting Note Entry (in Memory)

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

### 4.3 Memory Query Response

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

## 5. Tools Specification

### 5.1 Git Tools

#### `get_repo_context`
```
Input: 
  - repo: string (repo name)
  - limit: number = 20 (recent commits to return)

Output:
  - RepoContext (recent commits, stats, current branch)
  
Use Case:
  "What's been happening in auth-service?"
  → Shows last 10 commits, who's been working, current branch
```

#### `get_file_history`
```
Input:
  - repo: string
  - filePath: string
  - limit: number = 20

Output:
  - FileHistory (commits that touched this file)

Use Case:
  "Who touched the auth middleware?"
  → Shows all commits to that file, when, why
```

#### `get_commit_info`
```
Input:
  - repo: string
  - hash: string (or "HEAD", "HEAD~1", etc)

Output:
  - CommitInfo + full diff (optional)

Use Case:
  "Tell me about commit abc123"
  → Shows author, message, what files changed
```

#### `get_repo_stats`
```
Input:
  - repo: string
  - timeframe: "week" | "month" = "month"

Output:
  - Commits by person
  - Active branches
  - Top contributors

Use Case:
  "Who's been most active in frontend this month?"
```

#### `list_repos`
```
Input: (none)

Output:
  - All discovered repos with metadata

Use Case:
  "What repos are we tracking?"
```

---

### 5.2 Meeting & Memory Tools

#### `create_meeting_note`
```
Input:
  - vault: string
  - date: string (YYYY-MM-DD)
  - title: string
  - participants: string[] (from TEAM_MEMBERS)
  - decisions: string[]
  - actionItems: { task, owner, dueDate }[]
  - summary?: string

Output:
  - Created note path
  - Saved to Memory

Process:
  1. Create .md file in vault with structured template
  2. Parse to MeetingEntry schema
  3. Save to claude-mem Memory
  4. Return confirmation + Memory ID

Use Case:
  "Create meeting note from today's standup"
  → Saves both to Obsidian + Memory
```

#### `query_memory`
```
Input:
  - query: string (free text search)
  - filters?: {
      type?: "meeting" | "decision" | "action-item"
      author?: string
      from?: Date
      to?: Date
      repos?: string[]
    }

Output:
  - MemoryQueryResult (matching entries)

Use Case:
  "What decisions did we make about auth last month?"
  → Searches Memory, returns meetings + decisions
```

#### `get_team_context`
```
Input:
  - timeframe: "week" | "month"

Output:
  - TeamContextSnapshot

Use Case:
  "What's been happening team-wide this month?"
  → Shows who did what, what was decided, pending items
```

#### `list_action_items`
```
Input:
  - owner?: string (filter by person)
  - status?: "pending" | "in-progress" | "completed"

Output:
  - ActionItem[]

Use Case:
  "What do I need to do?" 
  → Shows Alice's pending tasks
```

---

## 6. Workflow Examples

### Example 1: Meeting Recap (2026-04-15)

**During meeting:**
```
Claude: create_meeting_note
  vault: FACULTAD
  date: 2026-04-15
  title: "Auth System Decision"
  participants: [Alice, Bob]
  decisions: 
    - "Use OAuth2 with PKCE"
    - "HTTP-only secure cookies for tokens"
  actionItems:
    - { task: "Implement OAuth2", owner: "Alice", dueDate: "2026-04-20" }
    - { task: "Review implementation", owner: "Bob", dueDate: "2026-04-22" }
```

**After meeting (in Obsidian):**
- Note created at: `Inteligencia Artificial/2026-04-15-auth-decision.md`
- Also saved in Memory with full entry

**Week later, Bob wants context:**
```
Claude: query_memory
  query: "auth oauth decision"
```
Returns: MeetingEntry with all details, action items status

---

### Example 2: Get Repo Stats

```
Claude: get_repo_stats
  repo: "auth-service"
  timeframe: "month"
```

Returns:
```
auth-service (last 30 days):
- Total commits: 47
- Alice: 23 commits
- Charlie: 18 commits
- Bob: 6 commits
- Active branches: main, feature/oauth, hotfix/token-bug
```

---

### Example 3: Team Context Snapshot

```
Claude: get_team_context
  timeframe: "month"
```

Returns: Who did what, what was decided, what's pending:
```
April 2026 Summary:
- 8 repos with 127 commits
- Top contributors: Alice (34), Charlie (28), Bob (20)
- Recent decisions: OAuth2, DB migration plan, API versioning
- Pending action items: 12 (8 on track, 4 at risk)
```

---

## 7. Implementation Plan

### Phase 1a: Foundation (Week 1)
- [ ] Update `config.ts` for multi-repo + team
- [ ] Create `Memory` wrapper class
- [ ] Add git utility functions (exec git commands)
- [ ] Define TypeScript interfaces

### Phase 1b: Git Tools (Week 1-2)
- [ ] Implement `get_repo_context`
- [ ] Implement `get_file_history`, `get_commit_info`
- [ ] Implement `get_repo_stats`
- [ ] Implement `list_repos`

### Phase 1c: Meeting Tools (Week 2)
- [ ] Create meeting note template
- [ ] Implement `create_meeting_note` (+ Memory save)
- [ ] Implement `query_memory`
- [ ] Implement `get_team_context`

### Phase 1d: Polish (Week 2-3)
- [ ] Integration tests
- [ ] Error handling
- [ ] Documentation + examples

---

## 8. Dependencies & Setup

### New Dependencies Needed
```json
{
  "simple-git": "^3.20.0",  // Git operations
  "octokit": "^2.0.0"        // GitHub API (optional, for org discovery)
}
```

### Environment Variables
```bash
GITHUB_TOKEN=ghp_... (optional, for org discovery + API rate limits)
MEMORY_API_KEY=... (if claude-mem requires explicit auth)
```

### File Structure
```
src/
  ├── index.ts (main MCP server)
  ├── config.ts (repos, team, vaults)
  ├── memory.ts (Memory wrapper class)
  ├── git/
  │   ├── git-utils.ts (git exec functions)
  │   ├── types.ts (CommitInfo, RepoContext, etc)
  │   └── get-repo-context.ts (tool implementation)
  ├── tools/
  │   ├── git-tools.ts (all git tools)
  │   ├── memory-tools.ts (all memory tools)
  │   └── meeting-tools.ts (meeting note tool)
  └── utils.ts
```

---

## 9. Success Criteria (Phase 1)

- ✅ Can read recent commits from multiple repos
- ✅ Can create meeting notes that auto-save to Memory
- ✅ Can query Memory to find decisions + action items
- ✅ Team can see "what's been happening" with `get_team_context`
- ✅ All tools handle multiple repos from GitHub org or manual list
- ✅ 8 team members are configured + visible in action items

---

## 10. Open Questions / Decisions

- **GitHub Org Discovery:** Should we auto-discover repos from GitHub org, or manual list?
- **Git Caching:** Cache repo info locally or always fresh?
- **Memory Limits:** Limits on Memory query size/frequency?
- **Commit Linking:** Phase 2 feature - auto-link commits that implement decisions?

