import Anthropic from "@anthropic-ai/sdk";
import { AUDIO_CONFIG } from "../config.js";
import { MeetingAnalysisSchema, type MeetingAnalysis } from "./types.js";

const SYSTEM_PROMPT = `Eres un asistente que analiza transcripciones de reuniones de negocios en español.
Analiza la transcripción proporcionada y extrae información estructurada.

Responde UNICAMENTE con JSON válido (sin markdown, sin code blocks). El JSON debe tener esta estructura exacta:
{
  "title": "título descriptivo de la reunión",
  "summary": "resumen ejecutivo (2-3 oraciones)",
  "objectives": ["lista de objetivos mencionados"],
  "roadmapSteps": [{"step": "descripción", "responsible": "persona o null", "deadline": "YYYY-MM-DD o null", "dependencies": ["deps"]}],
  "limitations": ["restricciones técnicas o de negocio mencionadas"],
  "people": [{"name": "nombre", "role": "rol o null", "company": "empresa o null", "mentionCount": 1}],
  "decisions": ["decisiones tomadas"],
  "actionItems": [{"task": "tarea", "owner": "responsable", "dueDate": "YYYY-MM-DD o null"}],
  "topics": ["temas principales para tags"]
}

Reglas:
- Si no se mencionan objetivos, roadmap, limitaciones, etc., devuelve arrays vacíos.
- Para personas, intenta detectar si pertenecen a la empresa contratadora o al equipo interno.
- Los action items deben tener un owner claro. Si no se menciona, usa "TBD".
- Las fechas deben estar en formato YYYY-MM-DD cuando se puedan inferir.`;

export class MeetingAnalyzer {
  private client: Anthropic;
  private model: string;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY no configurada. Requerida para analizar transcripciones."
      );
    }
    this.client = new Anthropic();
    this.model = AUDIO_CONFIG.analysisModel;
  }

  async analyze(
    transcript: string,
    context?: string,
    language: string = "es",
  ): Promise<MeetingAnalysis> {
    let userMessage = `Transcripción de la reunión:\n\n${transcript}`;
    if (context) {
      userMessage = `Contexto adicional: ${context}\n\n${userMessage}`;
    }
    if (language !== "es") {
      userMessage += `\n\nNota: el idioma de la transcripción es "${language}".`;
    }

    let lastError: Error | null = null;
    const delays = [1000, 2000, 4000];

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.error(`[Analyzer] Analyzing transcript (attempt ${attempt + 1}/3)...`);

        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        });

        const text = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map(block => block.text)
          .join("");

        const analysis = this.parseResponse(text);
        console.error(`[Analyzer] Analysis complete: "${analysis.title}"`);
        return analysis;
      } catch (err: any) {
        lastError = err;
        const isRetryable =
          err.status === 429 ||
          err.status === 529 ||
          (err.status && err.status >= 500);

        if (isRetryable && attempt < 2) {
          console.error(
            `[Analyzer] Retryable error (${err.status}), waiting ${delays[attempt]}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Analysis failed after 3 attempts: ${lastError?.message}`);
  }

  private parseResponse(text: string): MeetingAnalysis {
    // Try direct JSON parse first
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      // Try to extract JSON from markdown code block
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        json = JSON.parse(match[1]);
      } else {
        // Last resort: find first { and last }
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end > start) {
          json = JSON.parse(text.substring(start, end + 1));
        } else {
          throw new Error("Could not extract JSON from response");
        }
      }
    }

    // Validate with Zod, using defaults for missing fields
    const result = MeetingAnalysisSchema.safeParse(json);
    if (result.success) {
      return result.data;
    }

    // Best-effort: fill defaults for missing fields
    console.error(`[Analyzer] Zod validation partial failure, applying defaults`);
    const raw = json as Record<string, unknown>;
    return MeetingAnalysisSchema.parse({
      title: raw.title ?? "Reunión sin título",
      summary: raw.summary ?? "",
      objectives: Array.isArray(raw.objectives) ? raw.objectives : [],
      roadmapSteps: Array.isArray(raw.roadmapSteps) ? raw.roadmapSteps : [],
      limitations: Array.isArray(raw.limitations) ? raw.limitations : [],
      people: Array.isArray(raw.people) ? raw.people : [],
      decisions: Array.isArray(raw.decisions) ? raw.decisions : [],
      actionItems: Array.isArray(raw.actionItems) ? raw.actionItems : [],
      topics: Array.isArray(raw.topics) ? raw.topics : [],
    });
  }
}
