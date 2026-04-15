import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { CommitInfo, FileHistory, RepoContext, RepoStats } from "./types.js";

export class GitUtils {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = resolve(repoPath);
  }

  private exec(command: string): string {
    try {
      return execSync(command, {
        cwd: this.repoPath,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (error: any) {
      throw new Error(`Git command failed: ${error.message}`);
    }
  }

  getRecentCommits(limit: number = 20): CommitInfo[] {
    const format = "%H|%an|%ai|%s|%T";
    const output = this.exec(`git log -${limit} --format="${format}"`);

    return output
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        const [hash, author, date, message] = line.split("|");
        return {
          hash: hash.trim(),
          author: author.trim(),
          date: new Date(date.trim()),
          message: message.trim(),
          filesChanged: this.getFilesInCommit(hash),
        };
      });
  }

  private getFilesInCommit(commitHash: string): string[] {
    try {
      const output = this.exec(`git show --name-only --pretty="" ${commitHash}`);
      return output
        .split("\n")
        .filter(line => line.trim())
        .map(line => line.trim());
    } catch {
      return [];
    }
  }

  getFileHistory(filePath: string, limit: number = 20): FileHistory {
    const format = "%H|%an|%ai|%s";
    const output = this.exec(
      `git log -${limit} --format="${format}" -- "${filePath}"`
    );

    const commits = output
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        const [hash, author, date, message] = line.split("|");
        return {
          hash: hash.trim(),
          author: author.trim(),
          date: new Date(date.trim()),
          message: message.trim(),
          filesChanged: [filePath],
        };
      });

    return {
      filePath,
      commits,
    };
  }

  getCommitInfo(commitHashOrRef: string): CommitInfo {
    const format = "%H|%an|%ai|%s";
    const output = this.exec(`git log -1 --format="${format}" ${commitHashOrRef}`);

    if (!output.trim()) {
      throw new Error(`Commit not found: ${commitHashOrRef}`);
    }

    const [hash, author, date, message] = output.split("|");
    return {
      hash: hash.trim(),
      author: author.trim(),
      date: new Date(date.trim()),
      message: message.trim(),
      filesChanged: this.getFilesInCommit(hash.trim()),
    };
  }

  getCurrentBranch(): string {
    try {
      return this.exec("git rev-parse --abbrev-ref HEAD").trim();
    } catch {
      return "unknown";
    }
  }

  getActiveBranches(): string[] {
    try {
      const output = this.exec("git branch -a");
      return output
        .split("\n")
        .filter(line => line.trim())
        .map(line => line.replace(/^\*\s*/, "").trim())
        .filter(line => line.length > 0);
    } catch {
      return [];
    }
  }

  getStatsThisMonth(): RepoStats {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const format = "%an";
    const sinceDate = oneMonthAgo.toISOString().split("T")[0];
    const output = this.exec(
      `git log --since="${sinceDate}" --format="${format}"`
    );

    const authorCounts: Record<string, number> = {};
    output
      .split("\n")
      .filter(line => line.trim())
      .forEach(author => {
        const trimmed = author.trim();
        authorCounts[trimmed] = (authorCounts[trimmed] || 0) + 1;
      });

    const allCommits = this.exec(`git log --format="%H"`);
    const totalCommits = allCommits.split("\n").filter(line => line.trim()).length;

    const lastCommit = this.getRecentCommits(1)[0];

    return {
      name: this.getRepoName(),
      totalCommits,
      commitsByAuthor: authorCounts,
      activeBranches: this.getActiveBranches(),
      lastCommitDate: lastCommit?.date || new Date(),
    };
  }

  getRepoContext(limit: number = 20): RepoContext {
    const stats = this.getStatsThisMonth();
    const recentCommits = this.getRecentCommits(limit);

    const commitsThisMonth = Object.values(stats.commitsByAuthor).reduce(
      (a, b) => a + b,
      0
    );

    return {
      name: this.getRepoName(),
      recentCommits,
      currentBranch: this.getCurrentBranch(),
      stats: {
        commitsThisMonth,
        activeAuthors: Object.keys(stats.commitsByAuthor),
        commitsByAuthor: stats.commitsByAuthor,
      },
      lastUpdated: new Date(),
    };
  }

  private getRepoName(): string {
    try {
      const output = this.exec("git rev-parse --show-toplevel");
      const topLevel = output.trim();
      return topLevel.split(/[\\\/]/).pop() || "unknown";
    } catch {
      return "unknown";
    }
  }

  getDiff(fromRef: string = "HEAD~1", toRef: string = "HEAD"): string {
    try {
      return this.exec(`git diff ${fromRef}..${toRef}`);
    } catch {
      return "";
    }
  }
}

export function createGitUtils(repoPath: string): GitUtils {
  return new GitUtils(repoPath);
}
