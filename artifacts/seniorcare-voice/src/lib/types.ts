export type PipelineStage = "idle" | "transcribe" | "classify" | "respond" | "tts" | "complete" | "error";

export interface ConversationTurn {
  id: string;
  transcript: string;
  intent: string;
  intentLabelJa?: string;
  intentLabelEn?: string;
  replyJa: string;
  replyEn: string;
  audioBase64?: string;
}

export type Language = "ja" | "en";
