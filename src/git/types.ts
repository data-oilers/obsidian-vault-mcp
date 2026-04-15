export interface CommitInfo {
  hash: string;
  author: string;
  date: Date;
  message: string;
  filesChanged: string[];
}

export interface RepoContext {
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

export interface FileHistory {
  filePath: string;
  commits: CommitInfo[];
}

export interface RepoStats {
  name: string;
  totalCommits: number;
  commitsByAuthor: Record<string, number>;
  activeBranches: string[];
  lastCommitDate: Date;
}
