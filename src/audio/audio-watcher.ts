import chokidar from "chokidar";
import { rename, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { promisify } from "node:util";
import { AUDIO_CONFIG, VAULTS, TEAM_MEMBERS } from "../config.js";
import { memoryClient } from "../memory.js";
import { createMeetingNote } from "../tools/meeting-tools.js";
import { TranscriptionClient } from "./transcription-client.js";
import { MeetingAnalyzer } from "./meeting-analyzer.js";
import type { WatcherStatus, WatcherStats, MeetingAnalysis } from "./types.js";

const renameAsync = promisify(rename);

export class AudioWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private isProcessing = false;
  private queue: string[] = [];
  private currentlyProcessing: string | null = null;
  private stats: WatcherStats = {
    processedToday: 0,
    lastProcessed: null,
    failedFiles: [],
  };

  constructor(
    private transcriptionClient: TranscriptionClient,
    private meetingAnalyzer: MeetingAnalyzer,
  ) {}

  start(): void {
    // Ensure all directories exist
    for (const folder of AUDIO_CONFIG.watchFolders) {
      mkdirSync(folder, { recursive: true });
    }
    mkdirSync(AUDIO_CONFIG.processedFolder, { recursive: true });
    mkdirSync(AUDIO_CONFIG.failedFolder, { recursive: true });
    mkdirSync(AUDIO_CONFIG.transcriptsFolder, { recursive: true });

    this.watcher = chokidar.watch(AUDIO_CONFIG.watchFolders, {
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.watcher.on("add", (filePath: string) => {
      const ext = extname(filePath).toLowerCase();
      if (!AUDIO_CONFIG.supportedFormats.includes(ext)) return;

      console.error(`[AudioWatcher] New file detected: ${filePath}`);
      this.queue.push(filePath);

      if (AUDIO_CONFIG.autoProcess) {
        this.processQueue();
      }
    });

    this.watcher.on("error", (error: Error) => {
      console.error(`[AudioWatcher] Watcher error: ${error.message}`);
    });

    console.error(
      `[AudioWatcher] Watching ${AUDIO_CONFIG.watchFolders.length} folder(s) for audio files`
    );
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.error("[AudioWatcher] Stopped");
    }
  }

  getStatus(): WatcherStatus {
    return {
      isRunning: this.watcher !== null,
      watchedFolders: AUDIO_CONFIG.watchFolders,
      currentlyProcessing: this.currentlyProcessing,
      processedToday: this.stats.processedToday,
      lastProcessed: this.stats.lastProcessed,
      failedFiles: this.stats.failedFiles,
    };
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const filePath = this.queue.shift()!;
      this.currentlyProcessing = filePath;

      try {
        await this.processFile(filePath);
      } catch (err: any) {
        console.error(`[AudioWatcher] Failed to process ${filePath}: ${err.message}`);
        await this.moveToFailed(filePath, err.message);
      }

      this.currentlyProcessing = null;
    }

    this.isProcessing = false;
  }

  private async processFile(filePath: string): Promise<void> {
    const fileName = basename(filePath);
    console.error(`[AudioWatcher] Processing: ${fileName}`);

    // 1. Transcribe
    const transcription = await this.transcriptionClient.transcribe(filePath);

    // 2. Save transcript
    const transcriptName = fileName.replace(extname(fileName), ".txt");
    const transcriptPath = join(AUDIO_CONFIG.transcriptsFolder, transcriptName);
    writeFileSync(transcriptPath, transcription.transcript, "utf-8");
    console.error(`[AudioWatcher] Transcript saved: ${transcriptPath}`);

    // 3. Analyze
    const analysis = await this.meetingAnalyzer.analyze(transcription.transcript);

    // 4. Create meeting note
    const notePath = await this.createNote(analysis, transcription, filePath, transcriptPath);

    // 5. Move to processed
    const destPath = join(AUDIO_CONFIG.processedFolder, fileName);
    await renameAsync(filePath, destPath);

    // 6. Update stats
    this.stats.processedToday++;
    this.stats.lastProcessed = {
      file: fileName,
      notePath,
      timestamp: new Date().toISOString(),
    };

    console.error(`[AudioWatcher] Completed: ${fileName} -> ${notePath}`);
  }

  private async createNote(
    analysis: MeetingAnalysis,
    transcription: { transcript: string; duration: number; model: string },
    audioFilePath: string,
    transcriptPath: string,
  ): Promise<string> {
    const date = new Date().toISOString().substring(0, 10);

    // Filter participants: only recognized team members go to createMeetingNote
    const teamMemberNames = TEAM_MEMBERS.map(m => m.name);
    const recognizedParticipants = analysis.people
      .map(p => p.name)
      .filter(name => teamMemberNames.includes(name));

    // If no team members recognized, use a fallback
    const participants = recognizedParticipants.length > 0
      ? recognizedParticipants
      : [TEAM_MEMBERS[0]?.name ?? "Desconocido"];

    const result = await createMeetingNote({
      vault: AUDIO_CONFIG.defaultVault as "FACULTAD" | "DATAOILERS" | "PROYECTOS",
      date,
      title: analysis.title,
      participants,
      decisions: analysis.decisions,
      actionItems: analysis.actionItems.map(ai => ({
        task: ai.task,
        owner: teamMemberNames.includes(ai.owner) ? ai.owner : participants[0],
        dueDate: ai.dueDate ?? date,
      })),
      summary: analysis.summary,
    });

    const parsed = JSON.parse(result);
    const meetingId = parsed.meetingId as string;

    // Update the memory entry with audio extended data
    if (meetingId) {
      const externalPeople = analysis.people.filter(
        p => !teamMemberNames.includes(p.name)
      );

      await memoryClient.update(meetingId, {
        extendedData: {
          audioMetadata: {
            originalFile: basename(audioFilePath),
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

    return parsed.notePath ?? parsed.fullPath ?? "unknown";
  }

  private async moveToFailed(filePath: string, errorMessage: string): Promise<void> {
    const fileName = basename(filePath);
    try {
      const destPath = join(AUDIO_CONFIG.failedFolder, fileName);
      const errorFilePath = join(AUDIO_CONFIG.failedFolder, `${fileName}.error.txt`);

      if (existsSync(filePath)) {
        await renameAsync(filePath, destPath);
      }
      writeFileSync(errorFilePath, `Error: ${errorMessage}\nDate: ${new Date().toISOString()}\n`, "utf-8");

      this.stats.failedFiles.push({
        file: fileName,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    } catch (moveErr: any) {
      console.error(`[AudioWatcher] Failed to move to failed/: ${moveErr.message}`);
    }
  }
}
