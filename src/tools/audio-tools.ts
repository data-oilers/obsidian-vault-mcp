import { z } from "zod";
import { existsSync, writeFileSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { AUDIO_CONFIG, TEAM_MEMBERS } from "../config.js";
import { memoryClient } from "../memory.js";
import { TranscriptionClient } from "../audio/transcription-client.js";
import { MeetingAnalyzer } from "../audio/meeting-analyzer.js";
import { AudioWatcher } from "../audio/audio-watcher.js";
import { createMeetingNote } from "./meeting-tools.js";

// ─── Singletons ──────────────────────────────────────────────────────────────

let _transcriptionClient: TranscriptionClient | null = null;
let _meetingAnalyzer: MeetingAnalyzer | null = null;
let _audioWatcher: AudioWatcher | null = null;

function getTranscriptionClient(model?: "tiny" | "small" | "medium"): TranscriptionClient {
  if (!_transcriptionClient || model) {
    _transcriptionClient = new TranscriptionClient(model);
  }
  return _transcriptionClient;
}

function getMeetingAnalyzer(): MeetingAnalyzer {
  if (!_meetingAnalyzer) {
    _meetingAnalyzer = new MeetingAnalyzer();
  }
  return _meetingAnalyzer;
}

export function initializeAudioWatcher(): void {
  const client = getTranscriptionClient();
  const analyzer = getMeetingAnalyzer();
  _audioWatcher = new AudioWatcher(client, analyzer);
  _audioWatcher.start();
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const TranscribeAudioInputSchema = z.object({
  filePath: z.string().describe("Ruta absoluta al archivo de audio"),
  language: z.string().optional().default("es").describe("Idioma del audio (default: es)"),
  model: z
    .enum(["tiny", "small", "medium"])
    .optional()
    .default("small")
    .describe("Modelo Whisper a usar (tiny=rápido, small=balanceado, medium=preciso)"),
});

export const AnalyzeMeetingTranscriptInputSchema = z.object({
  transcript: z.string().describe("Transcripción del audio a analizar"),
  context: z
    .string()
    .optional()
    .describe("Contexto adicional (ej: 'reunión con empresa X')"),
  language: z.string().optional().default("es").describe("Idioma de la transcripción"),
});

export const ProcessMeetingRecordingInputSchema = z.object({
  filePath: z.string().describe("Ruta absoluta al archivo de audio"),
  title: z
    .string()
    .optional()
    .describe("Título de la reunión (si no se provee, se genera del análisis)"),
  vault: z
    .enum(["FACULTAD", "DATAOILERS", "PROYECTOS"])
    .optional()
    .default("DATAOILERS")
    .describe("Vault destino"),
  context: z
    .string()
    .optional()
    .describe("Contexto adicional para el análisis"),
  model: z
    .enum(["tiny", "small", "medium"])
    .optional()
    .default("small")
    .describe("Modelo Whisper"),
});

export const GetAudioWatcherStatusInputSchema = z.object({});

// ─── Handlers ────────────────────────────────────────────────────────────────

export async function transcribeAudio(
  input: z.infer<typeof TranscribeAudioInputSchema>,
): Promise<string> {
  const client = getTranscriptionClient(input.model);
  const result = await client.transcribe(input.filePath, input.language);

  return JSON.stringify(
    {
      success: true,
      transcript: result.transcript,
      segments: result.segments,
      language: result.language,
      duration: result.duration,
      durationFormatted: `${Math.floor(result.duration / 60)}m ${Math.round(result.duration % 60)}s`,
      model: result.model,
    },
    null,
    2,
  );
}

export async function analyzeMeetingTranscript(
  input: z.infer<typeof AnalyzeMeetingTranscriptInputSchema>,
): Promise<string> {
  const analyzer = getMeetingAnalyzer();
  const analysis = await analyzer.analyze(input.transcript, input.context, input.language);

  return JSON.stringify(
    {
      success: true,
      analysis,
    },
    null,
    2,
  );
}

export async function processMeetingRecording(
  input: z.infer<typeof ProcessMeetingRecordingInputSchema>,
): Promise<string> {
  const startTime = Date.now();

  // 1. Transcribe
  const client = getTranscriptionClient(input.model);
  const transcription = await client.transcribe(input.filePath);

  // 2. Save transcript
  const fileName = basename(input.filePath);
  const transcriptName = fileName.replace(extname(fileName), ".txt");
  const transcriptPath = join(AUDIO_CONFIG.transcriptsFolder, transcriptName);

  const { mkdirSync } = await import("node:fs");
  mkdirSync(AUDIO_CONFIG.transcriptsFolder, { recursive: true });
  writeFileSync(transcriptPath, transcription.transcript, "utf-8");

  // 3. Analyze
  const analyzer = getMeetingAnalyzer();
  const analysis = await analyzer.analyze(
    transcription.transcript,
    input.context,
  );

  // 4. Create meeting note
  const date = new Date().toISOString().substring(0, 10);
  const title = input.title ?? analysis.title;

  const teamMemberNames = TEAM_MEMBERS.map(m => m.name);
  const recognizedParticipants = analysis.people
    .map(p => p.name)
    .filter(name => teamMemberNames.includes(name));

  const participants = recognizedParticipants.length > 0
    ? recognizedParticipants
    : [TEAM_MEMBERS[0]?.name ?? "Desconocido"];

  const noteResult = await createMeetingNote({
    vault: input.vault as "FACULTAD" | "DATAOILERS" | "PROYECTOS",
    date,
    title,
    participants,
    decisions: analysis.decisions,
    actionItems: analysis.actionItems.map(ai => ({
      task: ai.task,
      owner: teamMemberNames.includes(ai.owner) ? ai.owner : participants[0],
      dueDate: ai.dueDate ?? date,
    })),
    summary: analysis.summary,
  });

  const parsed = JSON.parse(noteResult);
  const meetingId = parsed.meetingId as string;

  // 5. Update with extended audio data
  if (meetingId) {
    const externalPeople = analysis.people.filter(
      p => !teamMemberNames.includes(p.name),
    );

    await memoryClient.update(meetingId, {
      extendedData: {
        audioMetadata: {
          originalFile: fileName,
          duration: transcription.duration,
          language: AUDIO_CONFIG.language,
          transcriptPath,
          processingDate: new Date().toISOString(),
          whisperModel: transcription.model,
        },
        objectives: analysis.objectives,
        roadmapSteps: analysis.roadmapSteps,
        limitations: analysis.limitations,
        externalPeople,
      },
      tags: analysis.topics,
    });
  }

  const processingTime = Date.now() - startTime;

  return JSON.stringify(
    {
      success: true,
      notePath: parsed.notePath,
      meetingId,
      transcript: transcription.transcript,
      analysis,
      processingTime,
      processingTimeFormatted: `${Math.round(processingTime / 1000)}s`,
      transcriptPath,
    },
    null,
    2,
  );
}

export async function getAudioWatcherStatus(
  _input: z.infer<typeof GetAudioWatcherStatusInputSchema>,
): Promise<string> {
  if (!_audioWatcher) {
    return JSON.stringify(
      {
        isRunning: false,
        message: "Audio watcher no inicializado. Verificar configuración de audio.",
        watchedFolders: AUDIO_CONFIG.watchFolders,
        currentlyProcessing: null,
        processedToday: 0,
        lastProcessed: null,
        failedFiles: [],
      },
      null,
      2,
    );
  }

  return JSON.stringify(_audioWatcher.getStatus(), null, 2);
}
