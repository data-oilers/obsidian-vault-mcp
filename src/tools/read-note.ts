import { readFile } from "node:fs/promises";
import { resolveNotePath } from "../utils.js";

export interface ReadNoteParams {
  vault: string;
  path: string;
}

export async function readNote(params: ReadNoteParams): Promise<string> {
  try {
    const fullPath = resolveNotePath(params.vault, params.path);
    const content = await readFile(fullPath, "utf-8");
    return content;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return `Error: nota "${params.path}" no encontrada en ${params.vault}.`;
    }
    return `Error: ${err.message}`;
  }
}
