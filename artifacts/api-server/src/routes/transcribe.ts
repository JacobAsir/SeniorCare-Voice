import { Router, type IRouter } from "express";
import {
  TranscribeAudioBody,
  TranscribeAudioResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MOCK_TRANSCRIPTS: Record<string, string> = {
  mock_label: "この薬の飲み方を教えてください",
  mock_notice: "このお知らせの内容を教えてください",
  mock_daily: "今日の天気はどうですか",
  mock_repeat: "もう一度言ってください",
  mock_simplify: "もっと簡単に説明してください",
  mock_unsafe: "この薬を大量に飲んでも大丈夫ですか",
  default: "この薬の正しい飲み方を教えてください",
};

router.post("/transcribe", async (req, res): Promise<void> => {
  const parsed = TranscribeAudioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { mode, mockPromptId } = parsed.data;

  if (mode === "mock") {
    const key = mockPromptId ?? "default";
    const transcript = MOCK_TRANSCRIPTS[key] ?? MOCK_TRANSCRIPTS["default"]!;

    req.log.info({ mockPromptId: key }, "Mock transcription");

    res.json(
      TranscribeAudioResponse.parse({
        transcript,
        confidence: 0.97,
        mode: "mock",
        languageDetected: "ja",
      })
    );
    return;
  }

  // Live mode: in a real deployment, call Whisper / Groq STT here.
  // Without a provider key, fall back gracefully.
  const sttKey = process.env["STT_PROVIDER_KEY"];
  if (!sttKey) {
    req.log.warn("STT_PROVIDER_KEY not set, falling back to mock");
    const transcript = MOCK_TRANSCRIPTS["default"]!;
    res.json(
      TranscribeAudioResponse.parse({
        transcript,
        confidence: 0.5,
        mode: "fallback",
        languageDetected: "ja",
      })
    );
    return;
  }

  // TODO: integrate live STT provider
  req.log.info("Live STT requested but not yet integrated");
  res.status(501).json({ error: "Live STT not yet configured" });
});

export default router;
