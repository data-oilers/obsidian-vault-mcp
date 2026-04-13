import { readdir } from "node:fs/promises";
import { VAULTS } from "../config.js";

export interface ListSubjectsParams {
  vault: string;
}

export async function listSubjects(params: ListSubjectsParams): Promise<string> {
  const vault = VAULTS[params.vault];
  if (!vault) return `Error: vault "${params.vault}" no existe.`;

  const entries = await readdir(vault.path, { withFileTypes: true });

  const folders = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();

  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort();

  if (folders.length === 0) {
    return JSON.stringify({
      vault: params.vault,
      structure: "flat",
      notes: files,
    }, null, 2);
  }

  return JSON.stringify({
    vault: params.vault,
    structure: "folders",
    subjects: folders,
    root_notes: files,
  }, null, 2);
}
