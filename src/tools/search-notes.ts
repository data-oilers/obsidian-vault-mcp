import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { VAULTS } from "../config.js";

const exec = promisify(execFile);

export interface SearchNotesParams {
  vault: string;
  query: string;
}

interface SearchResult {
  path: string;
  matches: string[];
}

export async function searchNotes(params: SearchNotesParams): Promise<string> {
  const vault = VAULTS[params.vault];
  if (!vault) return `Error: vault "${params.vault}" no existe.`;
  if (!params.query.trim()) return "Error: query vacio.";

  try {
    const { stdout } = await exec("grep", [
      "-rilF",
      "--include=*.md",
      "--exclude-dir=.obsidian",
      "--exclude-dir=.git",
      params.query,
      vault.path,
    ]);

    const files = stdout.trim().split("\n").filter(Boolean).slice(0, 20);
    if (files.length === 0) return `Sin resultados para "${params.query}" en ${params.vault}.`;

    const results: SearchResult[] = [];

    for (const file of files) {
      const relative = file.replace(vault.path + "/", "");
      try {
        const { stdout: matchLines } = await exec("grep", [
          "-inF",
          "--color=never",
          params.query,
          file,
        ]);
        const matches = matchLines.trim().split("\n").slice(0, 3);
        results.push({ path: relative, matches });
      } catch {
        results.push({ path: relative, matches: [] });
      }
    }

    return JSON.stringify(results, null, 2);
  } catch (err: any) {
    if (err.code === 1) {
      // grep exit code 1 = no matches
      return `Sin resultados para "${params.query}" en ${params.vault}.`;
    }
    return `Error en busqueda: ${err.message}`;
  }
}
