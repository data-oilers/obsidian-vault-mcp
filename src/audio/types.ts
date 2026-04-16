import { z } from "zod";

// ─── Transcription Types ─────────────────────────────────────────────────────

export interface TranscriptSegment {
  start: number;    // seconds
  end: number;
  text: string;
  speaker?: string;
}

export interface TranscriptionResult {
  transcript: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;   // seconds
  model: string;
}

// ─── Meeting Analysis Schemas ────────────────────────────────────────────────

export const RoadmapStepSchema = z.object({
  step: z.string(),
  responsible: z.string().optional(),
  deadline: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

export const ExtractedPersonSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  mentionCount: z.number(),
});

export const MeetingAnalysisSchema = z.object({
  title: z.string(),
  summary: z.string(),
  objectives: z.array(z.string()),
  roadmapSteps: z.array(RoadmapStepSchema),
  limitations: z.array(z.string()),
  people: z.array(ExtractedPersonSchema),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({
      task: z.string(),
      owner: z.string(),
      dueDate: z.string().optional(),
    })
  ),
  topics: z.array(z.string()),
});

export const AudioMetadataSchema = z.object({
  originalFile: z.string(),
  duration: z.number(),
  language: z.string(),
  transcriptPath: z.string(),
  speakerCount: z.number().optional(),
  processingDate: z.string(),
  whisperModel: z.string(),
});

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type RoadmapStep = z.infer<typeof RoadmapStepSchema>;
export type ExtractedPerson = z.infer<typeof ExtractedPersonSchema>;
export type MeetingAnalysis = z.infer<typeof MeetingAnalysisSchema>;
export type AudioMetadata = z.infer<typeof AudioMetadataSchema>;

// ─── Watcher Types ───────────────────────────────────────────────────────────

export interface AudioWatchConfig {
  watchFolders: string[];
  processedFolder: string;
  failedFolder: string;
  transcriptsFolder: string;
  supportedFormats: string[];
  autoProcess: boolean;
}

export interface WatcherStats {
  processedToday: number;
  lastProcessed: { file: string; notePath: string; timestamp: string } | null;
  failedFiles: { file: string; error: string; timestamp: string }[];
}

export interface WatcherStatus {
  isRunning: boolean;
  watchedFolders: string[];
  currentlyProcessing: string | null;
  processedToday: number;
  lastProcessed: { file: string; notePath: string; timestamp: string } | null;
  failedFiles: { file: string; error: string; timestamp: string }[];
}
