import { Octokit } from "@octokit/rest";
import { GIT_CONFIG, REPOS } from "../config.js";

let octokit: Octokit | null = null;

function getOctokit(): Octokit {
  if (!octokit) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error(
        "GITHUB_TOKEN env var not set. Cannot query GitHub API."
      );
    }
    octokit = new Octokit({ auth: token });
  }
  return octokit;
}

interface RepoInfo {
  owner: string;
  repo: string;
}

function parseRepoUrl(url: string): RepoInfo {
  const match = url.match(/github\.com[/:]([\w-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }
  return { owner: match[1], repo: match[2] };
}

function getRepoInfo(repoName: string): RepoInfo {
  const repoConfig = REPOS[repoName];
  if (!repoConfig) {
    throw new Error(`Repo not configured: ${repoName}`);
  }
  return parseRepoUrl(repoConfig.url);
}

export async function getCommit(
  repoName: string,
  ref: string
): Promise<any> {
  const { owner, repo } = getRepoInfo(repoName);
  const octokit = getOctokit();

  try {
    const response = await octokit.repos.getCommit({
      owner,
      repo,
      ref,
    });

    return {
      hash: response.data.sha,
      author: response.data.commit.author?.name || "Unknown",
      email: response.data.commit.author?.email,
      date: response.data.commit.author?.date,
      message: response.data.commit.message,
      filesChanged: response.data.files?.length || 0,
      additions: response.data.stats?.additions || 0,
      deletions: response.data.stats?.deletions || 0,
      files: (response.data.files || []).map((f: any) => ({
        path: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
      })),
    };
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(`Commit not found: ${ref}`);
    }
    throw error;
  }
}

export async function getFileHistory(
  repoName: string,
  filePath: string,
  limit: number = 20
): Promise<any[]> {
  const { owner, repo } = getRepoInfo(repoName);
  const octokit = getOctokit();

  try {
    const response = await octokit.repos.listCommits({
      owner,
      repo,
      path: filePath,
      per_page: limit,
    });

    return response.data.map((commit: any) => ({
      hash: commit.sha.substring(0, 8),
      fullHash: commit.sha,
      author: commit.commit.author?.name || "Unknown",
      date: commit.commit.author?.date,
      message: commit.commit.message.split("\n")[0],
      url: commit.html_url,
    }));
  } catch (error: any) {
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function getRecentCommits(
  repoName: string,
  limit: number = 20
): Promise<any[]> {
  const { owner, repo } = getRepoInfo(repoName);
  const octokit = getOctokit();

  try {
    const response = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: limit,
    });

    return response.data.map((commit: any) => ({
      hash: commit.sha.substring(0, 8),
      fullHash: commit.sha,
      author: commit.commit.author?.name || "Unknown",
      date: commit.commit.author?.date,
      message: commit.commit.message.split("\n")[0],
      url: commit.html_url,
    }));
  } catch (error: any) {
    throw error;
  }
}

export async function getAuthorStats(
  repoName: string,
  timeframe: "week" | "month" = "month"
): Promise<any[]> {
  const { owner, repo } = getRepoInfo(repoName);
  const octokit = getOctokit();

  const since = new Date();
  if (timeframe === "week") {
    since.setDate(since.getDate() - 7);
  } else {
    since.setMonth(since.getMonth() - 1);
  }

  try {
    const response = await octokit.repos.listCommits({
      owner,
      repo,
      since: since.toISOString(),
      per_page: 100,
    });

    const stats: Record<string, { commits: number; lastActivity: string }> =
      {};

    for (const commit of response.data) {
      const author = commit.commit.author?.name || "Unknown";
      if (!stats[author]) {
        stats[author] = { commits: 0, lastActivity: "" };
      }
      stats[author].commits++;
      stats[author].lastActivity = commit.commit.author?.date || "";
    }

    return Object.entries(stats).map(([author, data]) => ({
      author,
      commits: data.commits,
      lastActivity: data.lastActivity,
    }));
  } catch (error: any) {
    throw error;
  }
}
