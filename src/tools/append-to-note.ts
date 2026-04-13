import { readFile, writeFile } from "node:fs/promises";
import { resolveNotePath } from "../utils.js";

export interface AppendToNoteParams {
  vault: string;
  path: string;
  content: string;
  section?: string;
}

export async function appendToNote(params: AppendToNoteParams): Promise<string> {
  let fullPath: string;
  try {
    fullPath = resolveNotePath(params.vault, params.path);
  } catch (err: any) {
    return `Error: ${err.message}`;
  }

  let existing: string;
  try {
    existing = await readFile(fullPath, "utf-8");
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return `Error: nota "${params.path}" no encontrada en ${params.vault}.`;
    }
    return `Error: ${err.message}`;
  }

  if (!params.section) {
    const updated = existing.trimEnd() + "\n\n" + params.content + "\n";
    await writeFile(fullPath, updated, "utf-8");
    return `Contenido agregado al final de ${params.path}.`;
  }

  // Insertar bajo un heading especifico
  const lines = existing.split("\n");
  const sectionLevel = (params.section.match(/^#+/) ?? ["#"])[0].length;
  let sectionIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === params.section.trim()) {
      sectionIdx = i;
      break;
    }
  }

  if (sectionIdx === -1) {
    // Seccion no encontrada, agregar al final como nueva seccion
    const updated = existing.trimEnd() + "\n\n" + params.section + "\n" + params.content + "\n";
    await writeFile(fullPath, updated, "utf-8");
    return `Seccion "${params.section}" creada al final de ${params.path}.`;
  }

  // Buscar donde termina la seccion (siguiente heading de igual o mayor nivel)
  let insertIdx = lines.length;
  for (let i = sectionIdx + 1; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^(#+)\s/);
    if (headingMatch && headingMatch[1].length <= sectionLevel) {
      insertIdx = i;
      break;
    }
  }

  lines.splice(insertIdx, 0, "", params.content);
  await writeFile(fullPath, lines.join("\n"), "utf-8");
  return `Contenido insertado en seccion "${params.section}" de ${params.path}.`;
}
