import { homedir } from "node:os";
import { join } from "node:path";

export interface VaultConfig {
  name: string;
  path: string;
  hasGit: boolean;
}

const HOME = homedir();

export const VAULTS: Record<string, VaultConfig> = {
  FACULTAD: {
    name: "FACULTAD",
    path: join(HOME, "Documentos", "FACULTAD"),
    hasGit: true,
  },
  DATAOILERS: {
    name: "DATAOILERS",
    path: join(HOME, "Escritorio", "DataOilers", "DATAOILERS"),
    hasGit: false,
  },
  PROYECTOS: {
    name: "PROYECTOS",
    path: join(HOME, "Documentos", "PROYECTOS"),
    hasGit: false,
  },
};

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
