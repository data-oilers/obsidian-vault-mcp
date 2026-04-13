import { formatDate, sanitizeFilename } from "./utils.js";
import { getSubjectTag } from "./config.js";

export type NoteType = "class-summary" | "concept" | "exercise" | "research" | "general";

export interface NoteData {
  title: string;
  subject: string;
  content: string;
  key_concepts?: string;
  definition?: string;
  examples?: string;
  problem?: string;
  solution?: string;
  notes?: string;
  context?: string;
  references?: string;
}

function frontmatter(type: NoteType, subject: string, extraTags: string[] = []): string {
  const date = formatDate();
  const subjectTag = getSubjectTag(subject);
  const tags = [...extraTags, subjectTag].map((t) => `"${t}"`).join(", ");
  return `---
type: ${type}
subject: "${subject}"
date: ${date}
tags: [${tags}]
source: claude-session
---`;
}

function classSummary(data: NoteData): string {
  return `${frontmatter("class-summary", data.subject, ["clase"])}

# ${data.title}

## Temas tratados
${data.content}

## Conceptos clave
${data.key_concepts || "- "}

## Preguntas pendientes
- `;
}

function concept(data: NoteData): string {
  return `${frontmatter("concept", data.subject, ["concepto"])}

# ${data.title}

## Definicion
${data.definition || ""}

## Explicacion
${data.content}

## Ejemplos
${data.examples || "- "}

## Relacion con otros conceptos
- `;
}

function exercise(data: NoteData): string {
  return `${frontmatter("exercise", data.subject, ["ejercicio"])}

# ${data.title}

## Enunciado
${data.problem || ""}

## Resolucion
${data.solution || data.content}

## Notas
${data.notes || "- "}`;
}

function research(data: NoteData): string {
  return `${frontmatter("research", data.subject, ["investigacion"])}

# ${data.title}

## Contexto
${data.context || ""}

## Hallazgos
${data.content}

## Referencias
${data.references || "- "}`;
}

function general(data: NoteData): string {
  return `${frontmatter("general", data.subject)}

# ${data.title}

${data.content}`;
}

const RENDERERS: Record<NoteType, (data: NoteData) => string> = {
  "class-summary": classSummary,
  concept,
  exercise,
  research,
  general,
};

export function renderTemplate(type: NoteType, data: NoteData): string {
  const renderer = RENDERERS[type];
  if (!renderer) throw new Error(`Template type "${type}" no existe`);
  return renderer(data);
}
