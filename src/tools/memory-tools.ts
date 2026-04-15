import { z } from "zod";
import { memoryClient } from "../memory.js";

export const QueryMemoryInputSchema = z.object({
  query: z.string().describe("Búsqueda de texto libre"),
  type: z
    .enum(["meeting", "decision", "action-item", "context"])
    .optional()
    .describe("Filtrar por tipo de entrada"),
  author: z.string().optional().describe("Filtrar por autor/participante"),
  from: z.string().optional().describe("Fecha de inicio (YYYY-MM-DD)"),
  to: z.string().optional().describe("Fecha de fin (YYYY-MM-DD)"),
  repos: z.array(z.string()).optional().describe("Filtrar por repositorios"),
});

export const GetTeamContextInputSchema = z.object({
  timeframe: z
    .enum(["week", "month"])
    .default("month")
    .describe("Período de tiempo"),
});

export const ListActionItemsInputSchema = z.object({
  owner: z.string().optional().describe("Filtrar por propietario"),
  status: z
    .enum(["pending", "in-progress", "completed"])
    .optional()
    .describe("Filtrar por estado"),
});

export type QueryMemoryInput = z.infer<typeof QueryMemoryInputSchema>;
export type GetTeamContextInput = z.infer<typeof GetTeamContextInputSchema>;
export type ListActionItemsInput = z.infer<typeof ListActionItemsInputSchema>;

export async function queryMemory(input: QueryMemoryInput): Promise<string> {
  const filters: any = {};

  if (input.type) filters.type = input.type;
  if (input.author) filters.author = input.author;
  if (input.from) filters.from = new Date(input.from);
  if (input.to) filters.to = new Date(input.to);
  if (input.repos) filters.repos = input.repos;

  const result = await memoryClient.query(input.query, filters);

  return JSON.stringify(
    {
      totalCount: result.totalCount,
      timeRange: result.timeRange,
      entries: result.entries.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        type: e.type,
        title: e.title,
        summary: e.summary,
        contributors: e.contributors,
        relatedRepos: e.relatedRepos,
      })),
    },
    null,
    2
  );
}

export async function getTeamContext(
  input: GetTeamContextInput
): Promise<string> {
  const context = await memoryClient.getTeamContext(input.timeframe);

  return JSON.stringify(context, null, 2);
}

export async function listActionItems(
  input: ListActionItemsInput
): Promise<string> {
  const items = await memoryClient.listActionItems(
    input.owner,
    input.status
  );

  return JSON.stringify(
    {
      totalCount: items.length,
      items,
    },
    null,
    2
  );
}

export const MEMORY_TOOLS = {
  queryMemory: {
    name: "query_memory",
    description: "Buscar en Memory por decisiones, reuniones, items de acción",
    schema: QueryMemoryInputSchema,
    handler: queryMemory,
  },
  getTeamContext: {
    name: "get_team_context",
    description: "Obtener snapshot del contexto del equipo (últimas semana/mes)",
    schema: GetTeamContextInputSchema,
    handler: getTeamContext,
  },
  listActionItems: {
    name: "list_action_items",
    description: "Listar items de acción pendientes",
    schema: ListActionItemsInputSchema,
    handler: listActionItems,
  },
};
