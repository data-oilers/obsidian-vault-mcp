import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { createNote } from "./tools/create-note.js";
import { searchNotes } from "./tools/search-notes.js";
import { listSubjects } from "./tools/list-subjects.js";
import { readNote } from "./tools/read-note.js";
import { appendToNote } from "./tools/append-to-note.js";
import { updateNote } from "./tools/update-note.js";

const server = new McpServer({
  name: "obsidian-vault",
  version: "1.0.0",
});

const vaultEnum = z.enum(["FACULTAD", "DATAOILERS"]);
const noteTypeEnum = z.enum(["class-summary", "concept", "exercise", "research", "general"]);

server.tool(
  "create_note",
  "Crear una nueva nota en un vault de Obsidian con template estructurado",
  {
    vault: vaultEnum.describe("Vault destino"),
    title: z.string().describe("Titulo de la nota"),
    content: z.string().describe("Contenido principal de la nota"),
    subject: z.string().optional().describe("Materia/carpeta (requerido para FACULTAD)"),
    type: noteTypeEnum.default("general").describe("Tipo de template: class-summary, concept, exercise, research, general"),
    key_concepts: z.string().optional().describe("Conceptos clave (para class-summary)"),
    definition: z.string().optional().describe("Definicion (para concept)"),
    examples: z.string().optional().describe("Ejemplos (para concept)"),
    problem: z.string().optional().describe("Enunciado del problema (para exercise)"),
    solution: z.string().optional().describe("Resolucion (para exercise)"),
    notes: z.string().optional().describe("Notas adicionales (para exercise)"),
    context: z.string().optional().describe("Contexto (para research)"),
    references: z.string().optional().describe("Referencias (para research)"),
  },
  async (params) => {
    const result = await createNote(params);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "search_notes",
  "Buscar notas por contenido en un vault de Obsidian",
  {
    vault: vaultEnum.describe("Vault donde buscar"),
    query: z.string().describe("Texto a buscar"),
  },
  async (params) => {
    const result = await searchNotes(params);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "list_subjects",
  "Listar materias/carpetas de un vault de Obsidian",
  {
    vault: vaultEnum.describe("Vault a listar"),
  },
  async (params) => {
    const result = await listSubjects(params);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "read_note",
  "Leer el contenido de una nota existente en un vault de Obsidian",
  {
    vault: vaultEnum.describe("Vault de la nota"),
    path: z.string().describe("Ruta relativa de la nota (ej: 'Inteligencia Artificial/6-4-26.md')"),
  },
  async (params) => {
    const result = await readNote(params);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "append_to_note",
  "Agregar contenido a una nota existente, opcionalmente bajo un heading especifico",
  {
    vault: vaultEnum.describe("Vault de la nota"),
    path: z.string().describe("Ruta relativa de la nota"),
    content: z.string().describe("Contenido a agregar"),
    section: z.string().optional().describe("Heading donde insertar (ej: '## Conceptos clave'). Si no se especifica, agrega al final."),
  },
  async (params) => {
    const result = await appendToNote(params);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "update_note",
  "Reescribir el contenido completo de una nota existente. Util para mejorar, reestructurar o agregar links entre conceptos",
  {
    vault: vaultEnum.describe("Vault de la nota"),
    path: z.string().describe("Ruta relativa de la nota"),
    content: z.string().describe("Nuevo contenido completo de la nota (reemplaza todo el contenido anterior)"),
  },
  async (params) => {
    const result = await updateNote(params);
    return { content: [{ type: "text", text: result }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
