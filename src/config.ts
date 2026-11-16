import { homedir } from "node:os";
import { join } from "node:path";

export interface VaultConfig {
  name: string;
  path: string;
  hasGit: boolean;
}

export interface TeamMember {
  name: string;
  email: string;
  role?: string;
}

export interface GitConfig {
  mode: "github-org";
  org: string;
  githubToken?: string;
  cacheDir: string;
  refreshInterval: number;
}

export interface RepoConfig {
  name: string;
  url: string;
  localPath: string;
  org: string;
}

const HOME = homedir();

// Git Configuration - GitHub Organization Mode
export const GIT_CONFIG: GitConfig = {
  mode: "github-org",
  org: process.env.GITHUB_ORG || "your-org-name",
  githubToken: process.env.GITHUB_TOKEN,
  cacheDir: join(HOME, ".claude", "git-cache"),
  refreshInterval: 3600000, // 1 hour
};

// Team Members - DataOilers
// Emails reconciliados 2026-11-16 contra Gmail real (ver pandora-refinery/02-areas/team/people.md).
// El equipo opera con direcciones @groupitmind.com en el día a día con clientes.
export const TEAM_MEMBERS: TeamMember[] = [
  { name: "Emiliano", email: process.env.TEAM_Emiliano_EMAIL || "esorato@groupitmind.com", role: "" },
  { name: "Emanuel",  email: process.env.TEAM_Emanuel_EMAIL  || "egallo@groupitmind.com",  role: "" },
  { name: "Agustin",  email: process.env.TEAM_Agustin_EMAIL  || "amunioz@groupitmind.com",  role: "" },
  { name: "Lautaro",  email: process.env.TEAM_Lautaro_EMAIL  || "lsanz@groupitmind.com",  role: "" },
  { name: "Franco",   email: process.env.TEAM_Franco_EMAIL   || "fmanca@groupitmind.com",   role: "CTO / co-founder" },
  { name: "Branco",   email: process.env.TEAM_Branco_EMAIL   || "balmeira@groupitmind.com",   role: "" },
  { name: "Gaston",   email: process.env.TEAM_Gaston_EMAIL   || "ggarcia@groupitmind.com",   role: "" },
  { name: "Eliezer",  email: process.env.TEAM_Eliezer_EMAIL  || "erivero@groupitmind.com", role: "" },
  // Agregados 2026-11-16 — vistos reiteradamente en correspondencia real con clientes, faltaban acá:
  { name: "JuanMancino", email: process.env.TEAM_JuanMancino_EMAIL || "jmancino@groupitmind.com", role: "" },
  { name: "Mariana",     email: process.env.TEAM_Mariana_EMAIL     || "mnunes@groupitmind.com",   role: "" },
  { name: "JuanExposito",email: process.env.TEAM_JuanExposito_EMAIL|| "jexposito@groupitmind.com",role: "" },
  { name: "AgustinaNieto",email: process.env.TEAM_AgustinaNieto_EMAIL|| "anieto@groupitmind.com", role: "" },
  { name: "Edgardo",     email: process.env.TEAM_Edgardo_EMAIL     || "ealcanoni@groupitmind.com",role: "" },
  { name: "Laura",       email: process.env.TEAM_Laura_EMAIL       || "lschilin@groupitmind.com", role: "Jefe de Soporte (a confirmar)" },
  { name: "Sergio",      email: process.env.TEAM_Sergio_EMAIL      || "sherrera@groupitmind.com", role: "" },
  { name: "JuanArias",   email: process.env.TEAM_JuanArias_EMAIL   || "jarias@groupitmind.com",   role: "" },
  { name: "Leandro",     email: process.env.TEAM_Leandro_EMAIL     || "lcattai@groupitmind.com",  role: "" },
 ];

// Obsidian Vaults
// Paths default cross-platform usando homedir(). Override via env var VAULTS_<NAME>_PATH.
export const VAULTS: Record<string, VaultConfig> = {
  DATAOILERS: {
    name: "DATAOILERS",
    // OJO: este path hoy apunta a logs de infra (D-xx/Q-xx/V-xx), no a la vault de coordinacion.
    // Nombre probablemente mal puesto — confirmar con quien lo configuro antes de reasignarlo.
    path: process.env.VAULTS_DATAOILERS_PATH || join(HOME, "Documentos", "DATAOILERS"),
    hasGit: true,
  },
  PANDORA_REFINERY: {
    name: "PANDORA_REFINERY",
    // Agregado 2026-11-16: esta vault no estaba registrada en absoluto, por eso
    // search_notes/read_note/get_team_context nunca encontraban nada de pandora-refinery.
    path: process.env.VAULTS_PANDORA_REFINERY_PATH || join(HOME, "Documentos", "GitHub", "pandora-refinery"),
    hasGit: true,
  },
  PROYECTOS: {
    name: "PROYECTOS",
    path: process.env.VAULTS_PROYECTOS_PATH || join(HOME, "Documentos", "PROYECTOS"),
    hasGit: false,
  },
  FACULTAD: {
    name: "FACULTAD",
    path: process.env.VAULTS_FACULTAD_PATH || join(HOME, "Documentos", "FACULTAD"),
    hasGit: false,
  },
  TESIS: {
    name: "TESIS",
    path: process.env.VAULTS_TESIS_PATH || join(HOME, "Documentos", "PROYECTOS", "Tesis-vault"),
    hasGit: false,
  },
};

// Repos from Data Oilers organization (local paths)
// Override via env var REPO_<NAME_UPPER_SNAKE>_PATH.
export let REPOS: Record<string, RepoConfig> = {
  "enterprise-ai-platform": {
    name: "enterprise-ai-platform",
    url: "https://github.com/data-oilers/enterprise-ai-platform",
    localPath:
      process.env.REPO_ENTERPRISE_AI_PLATFORM_PATH ||
      join(HOME, "repos", "data-oilers", "enterprise-ai-platform"),
    org: "data-oilers",
  },
  "itmind-infrastructure": {
    name: "itmind-infrastructure",
    url: "https://github.com/data-oilers/itmind-infrastructure",
    localPath:
      process.env.REPO_ITMIND_INFRASTRUCTURE_PATH ||
      join(HOME, "repos", "data-oilers", "itmind-infrastructure"),
    org: "data-oilers",
  },
  "pandora-refinery": {
    name: "pandora-refinery",
    url: "https://github.com/data-oilers/pandora-refinery",
    // Agregado 2026-11-16, junto con VAULTS.PANDORA_REFINERY (mismo path: es vault y repo a la vez).
    localPath:
      process.env.REPO_PANDORA_REFINERY_PATH ||
      join(HOME, "Documentos", "GitHub", "pandora-refinery"),
    org: "data-oilers",
  },
};

// Subject tags for categorization
export const SUBJECT_TAGS: Record<string, string> = {
  "Inteligencia Artificial": "inteligencia-artificial",
  "Seguridad en los Sistemas": "seguridad-sistemas",
  "Sistemas de Gestion": "sistemas-gestion",
  "Vision por computadora": "vision-computadora",
  "Proyecto Final": "proyecto-final",
  "Reconectar internet": "reconectar-internet",
  "Data-Oilers": "data-oilers",
  "ARCA-SDK": "arca-sdk",
};

export function getSubjectTag(subject: string): string {
  return SUBJECT_TAGS[subject] ?? subject.toLowerCase().replace(/\s+/g, "-");
}

export function setRepos(repos: Record<string, RepoConfig>): void {
  REPOS = repos;
}

export function getTeamMemberByName(name: string): TeamMember | undefined {
  return TEAM_MEMBERS.find(member => member.name === name);
}

// Maps git commit author names → canonical team member name
export const AUTHOR_ALIASES: Record<string, string> = {
  "emisorato1": "Emiliano",
  "Emiliano Vicente Sorato": "Emiliano",
  "Franco Manca": "Franco",
  "Lautaro Sanz": "Lautaro",
  "ËEG": "Emanuel",
  "eeg": "Emanuel",
  "Eneas Emanuel Gallo": "Emanuel",
  "agustin2505": "Agustin",
  "Gaston Garcia Juri": "Gaston",
  "Gaston": "Gaston",
  "branko007": "Branco",
  "Eliezer": "Eliezer",
};
