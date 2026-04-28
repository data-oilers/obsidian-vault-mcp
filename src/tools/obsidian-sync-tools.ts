import { z } from "zod";
import { join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { VAULTS, REPOS, TEAM_MEMBERS, AUTHOR_ALIASES } from "../config.js";
import { memoryClient, ContextEntry } from "../memory.js";
import { buildKnowledgeGraph } from "../graph/builder.js";
import { toMermaid } from "../graph/visualizer.js";
import { GitUtils } from "../git/git-utils.js";

export const SyncGraphToObsidianInputSchema = z.object({
  vault: z
    .enum(["FACULTAD", "DATAOILERS", "PROYECTOS"])
    .describe("Vault donde crear/actualizar las notas del equipo"),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 60);
}

function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

function writeNote(path: string, content: string): void {
  writeFileSync(path, content, "utf-8");
}

function wl(name: string): string {
  return `[[${name}]]`;
}

function wlAlias(id: string, label: string): string {
  return `[[${id}|${label}]]`;
}

function statusEmoji(status?: string): string {
  if (status === "completed") return "✅";
  if (status === "in-progress") return "🔄";
  return "🔵";
}

// ─── Note generators ──────────────────────────────────────────────────────────

function buildPersonNote(
  name: string,
  role: string | undefined,
  email: string | undefined,
  entries: ContextEntry[],
  repos: string[] = []
): string {
  const meetings = entries.filter(
    e => e.type === "meeting" && e.contributors?.includes(name)
  );
  const decisions = entries.filter(
    e => e.type === "decision" && e.contributors?.includes(name)
  );
  const actionItems = entries.filter(
    e => e.type === "action-item" && e.contributors?.includes(name)
  );

  const lines: string[] = [`# ${name}`, ""];
  if (role) lines.push(`**Rol:** ${role}`);
  if (email) lines.push(`**Email:** ${email}`);
  lines.push("");

  if (repos.length > 0) {
    lines.push(`## Repositorios`, "");
    for (const repo of repos) {
      lines.push(`- [[${repo}]]`);
    }
    lines.push("");
  }

  if (meetings.length > 0) {
    lines.push(`## Reuniones (${meetings.length})`, "");
    for (const m of meetings.sort((a, b) => b.timestamp.localeCompare(a.timestamp))) {
      lines.push(`- ${wl(m.title)} — ${m.timestamp.substring(0, 10)}`);
    }
    lines.push("");
  }

  if (decisions.length > 0) {
    lines.push(`## Decisiones (${decisions.length})`, "");
    for (const d of decisions) {
      lines.push(`- ${statusEmoji(d.status)} ${wlAlias(slugify(d.title), d.title)}`);
    }
    lines.push("");
  }

  if (actionItems.length > 0) {
    lines.push(`## Action Items`, "");
    for (const ai of actionItems) {
      const done = ai.status === "completed";
      lines.push(`- [${done ? "x" : " "}] ${ai.title}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildRepoNote(
  repoName: string,
  entries: ContextEntry[],
  gitContributors: string[] = []
): string {
  const decisions = entries.filter(
    e => e.type === "decision" && e.relatedRepos?.includes(repoName)
  );
  const meetings = entries.filter(
    e => e.type === "meeting" && e.relatedRepos?.includes(repoName)
  );

  // Unique committers: git-based (canonical names) + memory-based
  const committers = new Set<string>(gitContributors);
  for (const entry of entries) {
    for (const link of entry.linkedCommits ?? []) {
      if (link.repo === repoName) committers.add(link.commitAuthor);
    }
  }

  const lines: string[] = [`# ${repoName}`, ""];

  const repoConfig = REPOS[repoName];
  if (repoConfig?.url) lines.push(`**URL:** ${repoConfig.url}`, "");

  if (decisions.length > 0) {
    lines.push(`## Decisiones (${decisions.length})`, "");
    for (const d of decisions.sort((a, b) => b.timestamp.localeCompare(a.timestamp))) {
      const commits = d.linkedCommits?.filter(lc => lc.repo === repoName).length ?? 0;
      lines.push(
        `- ${statusEmoji(d.status)} ${wlAlias(slugify(d.title), d.title)}` +
          (commits > 0 ? ` — ${commits} commit${commits !== 1 ? "s" : ""}` : "")
      );
    }
    lines.push("");
  }

  if (meetings.length > 0) {
    lines.push(`## Reuniones`, "");
    for (const m of meetings) {
      lines.push(`- ${wl(m.title)} — ${m.timestamp.substring(0, 10)}`);
    }
    lines.push("");
  }

  if (committers.size > 0) {
    lines.push(`## Contribuidores`, "");
    for (const c of committers) {
      lines.push(`- ${wl(c)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildDecisionNote(d: ContextEntry): string {
  const lines: string[] = [`# ${d.title}`, ""];
  lines.push(`**Fecha:** ${d.timestamp.substring(0, 10)}`);
  lines.push(`**Estado:** ${d.status ?? "open"}`, "");

  if (d.contributors && d.contributors.length > 0) {
    lines.push(`## Participantes`, "");
    for (const p of d.contributors) lines.push(`- ${wl(p)}`);
    lines.push("");
  }

  if (d.relatedRepos && d.relatedRepos.length > 0) {
    lines.push(`## Repos afectados`, "");
    for (const repo of d.relatedRepos) lines.push(`- ${wl(repo)}`);
    lines.push("");
  }

  if (d.tags && d.tags.length > 0) {
    lines.push(`## Tags`, "");
    lines.push(d.tags.map(t => `#${t}`).join("  "));
    lines.push("");
  }

  if (d.linkedCommits && d.linkedCommits.length > 0) {
    lines.push(`## Implementación`, "");
    for (const link of d.linkedCommits) {
      const pct = Math.round(link.confidenceScore * 100);
      lines.push(
        `- \`${link.commitHash.substring(0, 8)}\` — ${wl(link.commitAuthor)} en ${wl(link.repo)}` +
          ` (${link.linkType}, ${pct}% confianza, ${link.createdBy})`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildMOC(
  people: string[],
  repos: string[],
  decisions: ContextEntry[],
  mermaidDiagram: string,
  stats: { nodes: number; edges: number },
  gitEdges: Array<{ person: string; repo: string }> = []
): string {
  const now = new Date().toISOString().substring(0, 16).replace("T", " ");

  const lines: string[] = [
    "# 🗺️ Mapa del Equipo",
    "",
    `> Generado por obsidian-vault-mcp · ${now}`,
    `> Nodos: **${stats.nodes}** · Conexiones: **${stats.edges}**`,
    "",
    "---",
    "",
    "## 👥 Personas",
    "",
    ...people.map(p => `- ${wl(p)}`),
    "",
    "## 📁 Repositorios",
    "",
    ...repos.map(r => `- ${wl(r)}`),
    "",
  ];

  const recentDecisions = decisions
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 15);

  if (recentDecisions.length > 0) {
    lines.push("## 🧠 Decisiones", "");
    for (const d of recentDecisions) {
      lines.push(
        `- ${statusEmoji(d.status)} ${wlAlias(slugify(d.title), d.title)} · ${d.timestamp.substring(0, 10)}`
      );
    }
    lines.push("");
  }

  // If the base graph has no edges but we have git-derived edges, build a simple diagram
  const effectiveMermaid =
    gitEdges.length > 0 && stats.edges === 0
      ? buildGitMermaid(people, repos, gitEdges)
      : mermaidDiagram;

  lines.push(
    "## 🔗 Knowledge Graph",
    "",
    "```mermaid",
    effectiveMermaid,
    "```",
    ""
  );

  return lines.join("\n");
}

function buildGitMermaid(
  people: string[],
  repos: string[],
  edges: Array<{ person: string; repo: string }>
): string {
  const lines: string[] = [
    "graph LR",
    "  classDef person fill:#E91E63,color:#fff,stroke:#880E4F",
    "  classDef repo fill:#9C27B0,color:#fff,stroke:#6A1B9A",
  ];

  for (const p of people) {
    const id = `person-${p.replace(/\s+/g, "_")}`;
    lines.push(`  ${id}(("${p}"))`);
    lines.push(`  class ${id} person`);
  }

  for (const r of repos) {
    const id = `repo-${r.replace(/\s+/g, "_")}`;
    lines.push(`  ${id}[("${r}")]`);
    lines.push(`  class ${id} repo`);
  }

  for (const edge of edges) {
    const pId = `person-${edge.person.replace(/\s+/g, "_")}`;
    const rId = `repo-${edge.repo.replace(/\s+/g, "_")}`;
    lines.push(`  ${pId} --> ${rId}`);
  }

  return lines.join("\n");
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function syncGraphToObsidian(
  input: z.infer<typeof SyncGraphToObsidianInputSchema>
): Promise<string> {
  const vault = VAULTS[input.vault];
  if (!vault) throw new Error(`Vault no encontrado: ${input.vault}`);

  const vaultPath = vault.path;
  const allEntries = memoryClient.getAll();
  const created: string[] = [];

  // ── Collect all people ───────────────────────────────────────────────────

  const knownPeople = new Map<
    string,
    { name: string; role?: string; email?: string }
  >();

  for (const m of TEAM_MEMBERS) {
    knownPeople.set(m.name, { name: m.name, role: m.role, email: m.email });
  }
  for (const entry of allEntries) {
    for (const c of entry.contributors ?? []) {
      if (!knownPeople.has(c)) knownPeople.set(c, { name: c });
    }
    for (const link of entry.linkedCommits ?? []) {
      if (!knownPeople.has(link.commitAuthor)) {
        knownPeople.set(link.commitAuthor, { name: link.commitAuthor });
      }
    }
  }

  // ── Collect all repos ────────────────────────────────────────────────────

  const allRepos = new Set<string>(Object.keys(REPOS));
  for (const entry of allEntries) {
    for (const repo of entry.relatedRepos ?? []) allRepos.add(repo);
    for (const link of entry.linkedCommits ?? []) allRepos.add(link.repo);
  }

  // ── Build git-based person→repo relationships ─────────────────────────────

  const personRepos = new Map<string, Set<string>>(); // canonical name → repos
  const repoContributors = new Map<string, Set<string>>(); // repo → canonical names
  const gitEdges: Array<{ person: string; repo: string }> = [];

  for (const [repoName, repoConfig] of Object.entries(REPOS)) {
    try {
      const git = new GitUtils(repoConfig.localPath);
      const stats = git.getStatsThisMonth();
      const contributors = new Set<string>();

      for (const gitAuthor of Object.keys(stats.commitsByAuthor)) {
        const canonical = AUTHOR_ALIASES[gitAuthor] ?? gitAuthor;
        if (knownPeople.has(canonical)) {
          contributors.add(canonical);
          if (!personRepos.has(canonical)) personRepos.set(canonical, new Set());
          personRepos.get(canonical)!.add(repoName);
          gitEdges.push({ person: canonical, repo: repoName });
        }
      }

      repoContributors.set(repoName, contributors);
    } catch {
      repoContributors.set(repoName, new Set());
    }
  }

  // ── _atlas/people/ ───────────────────────────────────────────────────────
  // Auto-generated MOCs por persona. Convive con _atlas/people-overview.md
  // (narrativa curada a mano). Convención LYT: plural=auto-gen, singular=curado.

  const peopleDir = join(vaultPath, "_atlas", "people");
  ensureDir(peopleDir);

  for (const [name, person] of knownPeople) {
    const repos = Array.from(personRepos.get(name) ?? []);
    const content = buildPersonNote(name, person.role, person.email, allEntries, repos);
    writeNote(join(peopleDir, `${name}.md`), content);
    created.push(`_atlas/people/${name}.md`);
  }

  // ── _atlas/repos/ ────────────────────────────────────────────────────────

  const reposDir = join(vaultPath, "_atlas", "repos");
  ensureDir(reposDir);

  for (const repoName of allRepos) {
    const contributors = Array.from(repoContributors.get(repoName) ?? []);
    const content = buildRepoNote(repoName, allEntries, contributors);
    writeNote(join(reposDir, `${repoName}.md`), content);
    created.push(`_atlas/repos/${repoName}.md`);
  }

  // ── decisions/ ───────────────────────────────────────────────────────────

  const decisionsDir = join(vaultPath, "decisions");
  ensureDir(decisionsDir);

  const decisions = allEntries.filter(e => e.type === "decision");
  for (const d of decisions) {
    const slug = slugify(d.title);
    const content = buildDecisionNote(d);
    writeNote(join(decisionsDir, `${slug}.md`), content);
    created.push(`decisions/${slug}.md`);
  }

  // ── _Mapa del Equipo.md (MOC) ────────────────────────────────────────────

  const graph = await buildKnowledgeGraph();
  const mermaidDiagram = toMermaid(graph, {
    nodeTypes: ["decision", "meeting", "person", "repo"],
    minImportance: 0,
  });

  const moc = buildMOC(
    Array.from(knownPeople.keys()),
    Array.from(allRepos),
    decisions,
    mermaidDiagram,
    { nodes: graph.nodes.size, edges: graph.edges.length },
    gitEdges
  );

  const atlasDir = join(vaultPath, "_atlas");
  ensureDir(atlasDir);
  writeNote(join(atlasDir, "team-map.md"), moc);
  created.push("_atlas/team-map.md");

  return JSON.stringify(
    {
      success: true,
      vault: input.vault,
      vaultPath,
      notesCreated: created.length,
      breakdown: {
        personas: Array.from(knownPeople.keys()).length,
        repos: allRepos.size,
        decisions: decisions.length,
        moc: 1,
      },
      created,
      nextStep:
        "Abrí el vault en Obsidian → Graph View (Ctrl+G) para ver las conexiones. " +
        "Buscá '_Mapa del Equipo' para el overview con el diagrama Mermaid.",
    },
    null,
    2
  );
}
