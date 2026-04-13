import { readFile, writeFile } from "node:fs/promises";
import { resolveNotePath } from "../utils.js";

export interface UpdateNoteParams {
  vault: string;
  path: string;
  content: string;
}

export async function updateNote(params: UpdateNoteParams): Promise<string> {
  let fullPath: string;
  try {
    fullPath = resolveNotePath(params.vault, params.path);
  } catch (err: any) {
    return `Error: ${err.message}`;
  }

  // Verificar que la nota existe antes de sobrescribir
  try {
    await readFile(fullPath, "utf-8");
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return `Error: nota "${params.path}" no encontrada en ${params.vault}. Usa create_note para crear una nueva.`;
    }
    return `Error: ${err.message}`;
  }

  await writeFile(fullPath, params.content, "utf-8");
  return `Nota actualizada: ${params.path}`;
}
