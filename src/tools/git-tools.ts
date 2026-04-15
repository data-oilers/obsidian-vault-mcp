import { z } from "zod";
import { REPOS } from "../config.js";
import { createGitUtils } from "../git/git-utils.js";
import { RepoContext } from "../git/types.js";

export const GetRepoContextInputSchema = z.object({
  repo: z.string().describe("Nombre del repositorio"),
  limit: z.number().optional().default(20).describe("Número de commits recientes a retornar"),
});

export const GetFileHistoryInputSchema = z.object({
  repo: z.string().describe("Nombre del repositorio"),
  filePath: z.string().describe("Ruta relativa del archivo en el repo"),
  limit: z.number().optional().default(20).describe("Número de commits a retornar"),
});

export const GetCommitInfoInputSchema = z.object({
  repo: z.string().describe("Nombre del repositorio"),
  hash: z.string().describe("Hash del commit o referencia (ej: HEAD, HEAD~1, abc123)"),
});

export const GetRepoStatsInputSchema = z.object({
  repo: z.string().describe("Nombre del repositorio"),
  timeframe: z.enum(["week", "month"]).optional().default("month").describe("Período de tiempo para estadísticas"),
});

export const ListReposInputSchema = z.object({});

export type GetRepoContextInput = z.infer<typeof GetRepoContextInputSchema>;
export type GetFileHistoryInput = z.infer<typeof GetFileHistoryInputSchema>;
export type GetCommitInfoInput = z.infer<typeof GetCommitInfoInputSchema>;
export type GetRepoStatsInput = z.infer<typeof GetRepoStatsInputSchema>;

function validateRepoExists(repoName: string): void {
  if (!REPOS[repoName]) {
    throw new Error(
      `Repositorio no encontrado: ${repoName}. Repos disponibles: ${Object.keys(REPOS).join(", ")}`
    );
  }
}

export async function getRepoContext(input: GetRepoContextInput): Promise<string> {
  validateRepoExists(input.repo);
  const repoConfig = REPOS[input.repo];

  const gitUtils = createGitUtils(repoConfig.localPath);
  const context: RepoContext = gitUtils.getRepoContext(input.limit);

  return JSON.stringify(context, null, 2);
}

export async function getFileHistory(input: GetFileHistoryInput): Promise<string> {
  validateRepoExists(input.repo);
  const repoConfig = REPOS[input.repo];

  const gitUtils = createGitUtils(repoConfig.localPath);
  const history = gitUtils.getFileHistory(input.filePath, input.limit);

  return JSON.stringify(history, null, 2);
}

export async function getCommitInfo(input: GetCommitInfoInput): Promise<string> {
  validateRepoExists(input.repo);
  const repoConfig = REPOS[input.repo];

  const gitUtils = createGitUtils(repoConfig.localPath);
  const commitInfo = gitUtils.getCommitInfo(input.hash);

  return JSON.stringify(commitInfo, null, 2);
}

export async function getRepoStats(input: GetRepoStatsInput): Promise<string> {
  validateRepoExists(input.repo);
  const repoConfig = REPOS[input.repo];

  const gitUtils = createGitUtils(repoConfig.localPath);
  const stats = gitUtils.getStatsThisMonth();

  const result = {
    name: stats.name,
    commitsByAuthor: stats.commitsByAuthor,
    activeBranches: stats.activeBranches,
    lastCommitDate: stats.lastCommitDate.toISOString(),
  };

  return JSON.stringify(result, null, 2);
}

export async function listRepos(): Promise<string> {
  const repos = Object.entries(REPOS).map(([name, config]) => ({
    name,
    url: config.url,
    org: config.org,
    localPath: config.localPath,
  }));

  return JSON.stringify(
    {
      total: repos.length,
      repos,
    },
    null,
    2
  );
}

export const GIT_TOOLS = {
  getRepoContext: {
    name: "get_repo_context",
    description:
      "Obtener contexto reciente de un repositorio (commits, estadísticas, rama actual)",
    schema: GetRepoContextInputSchema,
    handler: getRepoContext,
  },
  getFileHistory: {
    name: "get_file_history",
    description: "Obtener histórico de commits de un archivo específico",
    schema: GetFileHistoryInputSchema,
    handler: getFileHistory,
  },
  getCommitInfo: {
    name: "get_commit_info",
    description: "Obtener información detallada de un commit específico",
    schema: GetCommitInfoInputSchema,
    handler: getCommitInfo,
  },
  getRepoStats: {
    name: "get_repo_stats",
    description: "Obtener estadísticas de commits por autor (último mes)",
    schema: GetRepoStatsInputSchema,
    handler: getRepoStats,
  },
  listRepos: {
    name: "list_repos",
    description: "Listar todos los repositorios siendo trackeados",
    schema: ListReposInputSchema,
    handler: listRepos,
  },
};
