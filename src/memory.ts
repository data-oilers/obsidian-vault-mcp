import { z } from "zod";

// Memory entry schemas
export const DecisionSchema = z.object({
  text: z.string(),
  owner: z.string().optional(),
  relatedIssue: z.string().optional(),
});

export const ActionItemSchema = z.object({
  task: z.string(),
  owner: z.string(),
  dueDate: z.string(), // ISO date string
  status: z.enum(["pending", "in-progress", "completed"]),
  relatedIssue: z.string().optional(),
});

export const MeetingEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(), // ISO date string
  title: z.string(),
  summary: z.string(),
  participants: z.array(z.string()),
  decisions: z.array(DecisionSchema),
  actionItems: z.array(ActionItemSchema),
  vault: z.string(),
  notePath: z.string(),
  relatedRepos: z.array(z.string()).optional(),
});

export const ContextEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  type: z.enum(["meeting", "decision", "context", "action-item"]),
  category: z.string().optional(),
  title: z.string(),
  summary: z.string(),
  contributors: z.array(z.string()).optional(),
  relatedRepos: z.array(z.string()).optional(),
  relatedLinks: z.array(z.string()).optional(),
});

export type Decision = z.infer<typeof DecisionSchema>;
export type ActionItem = z.infer<typeof ActionItemSchema>;
export type MeetingEntry = z.infer<typeof MeetingEntrySchema>;
export type ContextEntry = z.infer<typeof ContextEntrySchema>;

export interface MemoryQueryResult {
  entries: ContextEntry[];
  totalCount: number;
  timeRange: { from: string; to: string };
}

export interface TeamContextSnapshot {
  timeframe: "week" | "month";
  summary: string;
  contributors: { name: string; commits: number; activity: string }[];
  recentDecisions: Decision[];
  pendingActionItems: ActionItem[];
  activeRepos: string[];
}

export class MemoryClient {
  private useLocalStorage: boolean = false;
  private entries: ContextEntry[] = [];

  constructor() {
    // Initialize: check if claude-mem is available
    // For now, use local storage fallback
    this.useLocalStorage = true;
  }

  async save(type: string, entry: Record<string, unknown>): Promise<string> {
    const id = `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const contextEntry: ContextEntry = {
      id,
      timestamp: new Date().toISOString(),
      type: type as any,
      title: (entry.title as string) || "Untitled",
      summary: (entry.summary as string) || "",
      contributors: entry.participants as string[] | undefined,
      relatedRepos: entry.relatedRepos as string[] | undefined,
    };

    try {
      ContextEntrySchema.parse(contextEntry);
    } catch (error) {
      throw new Error(`Invalid memory entry: ${error}`);
    }

    if (this.useLocalStorage) {
      this.entries.push(contextEntry);
    } else {
      // TODO: Call claude-mem API when available
      // await memoryApi.save(contextEntry);
    }

    return id;
  }

  async saveMeeting(entry: MeetingEntry): Promise<string> {
    const validated = MeetingEntrySchema.parse(entry);
    return this.save("meeting", {
      title: validated.title,
      summary: validated.summary,
      participants: validated.participants,
      decisions: validated.decisions,
      actionItems: validated.actionItems,
      relatedRepos: validated.relatedRepos,
      notePath: validated.notePath,
    });
  }

  async query(
    searchQuery: string,
    filters?: {
      type?: string;
      author?: string;
      from?: Date;
      to?: Date;
      repos?: string[];
    }
  ): Promise<MemoryQueryResult> {
    let results = this.entries;

    if (filters?.type) {
      results = results.filter(e => e.type === filters.type);
    }

    if (filters?.author) {
      results = results.filter(e =>
        e.contributors?.includes(filters.author!)
      );
    }

    if (filters?.from) {
      results = results.filter(e => new Date(e.timestamp) >= filters.from!);
    }

    if (filters?.to) {
      results = results.filter(e => new Date(e.timestamp) <= filters.to!);
    }

    if (filters?.repos) {
      results = results.filter(e =>
        e.relatedRepos?.some(r => filters.repos!.includes(r))
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        e =>
          e.title.toLowerCase().includes(query) ||
          e.summary.toLowerCase().includes(query)
      );
    }

    return {
      entries: results,
      totalCount: results.length,
      timeRange: {
        from: filters?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: filters?.to?.toISOString() || new Date().toISOString(),
      },
    };
  }

  async getTeamContext(timeframe: "week" | "month"): Promise<TeamContextSnapshot> {
    const days = timeframe === "week" ? 7 : 30;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const to = new Date();

    const results = await this.query("", {
      from,
      to,
    });

    const decisions: Decision[] = [];
    const actionItems: ActionItem[] = [];
    const repos = new Set<string>();
    const contributors = new Map<string, number>();

    for (const entry of results.entries) {
      if (entry.contributors) {
        entry.contributors.forEach(c => {
          contributors.set(c, (contributors.get(c) || 0) + 1);
        });
      }
      if (entry.relatedRepos) {
        entry.relatedRepos.forEach(r => repos.add(r));
      }
    }

    return {
      timeframe,
      summary: `Actividad de equipo de los últimos ${days} días`,
      contributors: Array.from(contributors.entries()).map(([name, commits]) => ({
        name,
        commits,
        activity: `${commits} eventos registrados`,
      })),
      recentDecisions: decisions,
      pendingActionItems: actionItems,
      activeRepos: Array.from(repos),
    };
  }

  async listActionItems(
    owner?: string,
    status?: "pending" | "in-progress" | "completed"
  ): Promise<ActionItem[]> {
    const results = await this.query("", {
      type: "action-item",
      author: owner,
    });

    // Extract action items from meetings
    const items: ActionItem[] = [];

    for (const entry of results.entries) {
      // Parse action items from entry
      // This would need to be enhanced based on how we store action items
    }

    if (status) {
      return items.filter(item => item.status === status);
    }

    return items;
  }

  async clear(): Promise<void> {
    this.entries = [];
  }

  // For testing/debugging
  getEntriesCount(): number {
    return this.entries.length;
  }
}

export const memoryClient = new MemoryClient();
