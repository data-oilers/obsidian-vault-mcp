import { existsSync } from "node:fs";
import { extname } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AUDIO_CONFIG } from "../config.js";
import type { TranscriptionResult, TranscriptSegment } from "./types.js";

const execFileAsync = promisify(execFile);

const WHISPER_MODEL_MAP: Record<string, string> = {
  tiny: "Xenova/whisper-tiny",
  small: "Xenova/whisper-small",
  medium: "Xenova/whisper-medium",
};

export class TranscriptionClient {
  private pipeline: any | null = null;
  private modelName: string;
  private modelSize: string;
  private backend: "transformers" | "faster-whisper";

  constructor(
    model: "tiny" | "small" | "medium" = AUDIO_CONFIG.whisperModel,
    backend: "transformers" | "faster-whisper" = AUDIO_CONFIG.transcriptionBackend,
  ) {
    this.modelSize = model;
    this.modelName = WHISPER_MODEL_MAP[model];
    this.backend = backend;
  }

  async initialize(): Promise<void> {
    if (this.pipeline) return;
    if (this.backend === "faster-whisper") return;

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.error(`[Whisper] Loading model ${this.modelName} (attempt ${attempt}/3)...`);
        const { pipeline } = await import("@xenova/transformers");
        this.pipeline = await pipeline("automatic-speech-recognition", this.modelName, {
          quantized: true,
        });
        console.error(`[Whisper] Model ${this.modelName} loaded successfully`);
        return;
      } catch (err: any) {
        lastError = err;
        console.error(`[Whisper] Attempt ${attempt} failed: ${err.message}`);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    throw new Error(`Failed to load Whisper model after 3 attempts: ${lastError?.message}`);
  }

  async transcribe(filePath: string, language: string = AUDIO_CONFIG.language): Promise<TranscriptionResult> {
    if (!existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    const ext = extname(filePath).toLowerCase();
    if (!AUDIO_CONFIG.supportedFormats.includes(ext)) {
      throw new Error(
        `Unsupported audio format: ${ext}. Supported: ${AUDIO_CONFIG.supportedFormats.join(", ")}`
      );
    }

    if (this.backend === "faster-whisper") {
      return this.transcribeWithPython(filePath, language);
    }

    await this.initialize();

    console.error(`[Whisper] Transcribing: ${filePath}`);
    const result = await this.pipeline!(filePath, {
      language,
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    });

    const segments: TranscriptSegment[] = (result.chunks ?? []).map(
      (chunk: { timestamp: [number, number]; text: string }) => ({
        start: chunk.timestamp[0] ?? 0,
        end: chunk.timestamp[1] ?? 0,
        text: chunk.text.trim(),
      })
    );

    const duration = segments.length > 0
      ? segments[segments.length - 1].end
      : 0;

    return {
      transcript: result.text.trim(),
      segments,
      language,
      duration,
      model: this.modelSize,
    };
  }

  private async transcribeWithPython(
    filePath: string,
    language: string,
  ): Promise<TranscriptionResult> {
    console.error(`[Whisper] Transcribing with faster-whisper: ${filePath}`);

    const { stdout } = await execFileAsync("python3", [
      "-c",
      `
import json, sys
from faster_whisper import WhisperModel

model = WhisperModel("${this.modelSize}", device="cpu", compute_type="int8")
segments, info = model.transcribe("${filePath}", language="${language}")

result = {"segments": [], "text": ""}
texts = []
for seg in segments:
    result["segments"].append({
        "start": seg.start,
        "end": seg.end,
        "text": seg.text.strip()
    })
    texts.append(seg.text.strip())

result["text"] = " ".join(texts)
result["duration"] = info.duration
result["language"] = info.language
print(json.dumps(result))
`,
    ], { maxBuffer: 50 * 1024 * 1024 });

    const parsed = JSON.parse(stdout);

    return {
      transcript: parsed.text,
      segments: parsed.segments.map((s: any) => ({
        start: s.start,
        end: s.end,
        text: s.text,
      })),
      language: parsed.language ?? language,
      duration: parsed.duration ?? 0,
      model: this.modelSize,
    };
  }

  getSupportedFormats(): string[] {
    return [...AUDIO_CONFIG.supportedFormats];
  }
}
