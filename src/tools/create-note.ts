import { writeFile, access } from "node:fs/promises";
import { dirname } from "node:path";
import { VAULTS } from "../config.js";
import { buildNotePath, ensureDir } from "../utils.js";
import { renderTemplate, type NoteType, type NoteData } from "../templates.js";

export interface CreateNoteParams {
  vault: string;
  title: string;
  content: string;
  subject?: string;
  type?: NoteType;
  key_concepts?: string;
  definition?: string;
  examples?: string;
  problem?: string;
  solution?: string;
  notes?: string;
  context?: string;
  references?: string;
}

export async function createNote(params: CreateNoteParams): Promise<string> {
  const vault = VAULTS[params.vault];
  if (!vault) return `Error: vault "${params.vault}" no existe. Usa FACULTAD o DATAOILERS.`;

  if (params.vault === "FACULTAD" && !params.subject) {
    return "Error: se requiere 'subject' (nombre de la materia) para el vault FACULTAD.";
  }

  const noteType: NoteType = params.type ?? "general";
  const filePath = buildNotePath(params.vault, params.title, params.subject);

  // No sobrescribir archivos existentes
  try {
    await access(filePath);
    return `Error: ya existe una nota en "${filePath}". Usa otro titulo o append_to_note.`;
  } catch {
    // No existe, podemos crear
  }

  await ensureDir(dirname(filePath));

  const data: NoteData = {
    title: params.title,
    subject: params.subject ?? params.vault,
    content: params.content,
    key_concepts: params.key_concepts,
    definition: params.definition,
    examples: params.examples,
    problem: params.problem,
    solution: params.solution,
    notes: params.notes,
    context: params.context,
    references: params.references,
  };

  const markdown = renderTemplate(noteType, data);
  await writeFile(filePath, markdown, "utf-8");

  const relative = filePath.replace(vault.path + "/", "");
  return `Nota creada: ${relative}`;
}
