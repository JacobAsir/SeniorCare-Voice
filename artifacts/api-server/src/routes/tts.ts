import { Router, type IRouter } from "express";
import { SynthesizeSpeechBody, SynthesizeSpeechResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// Minimal valid MP3 header (silent, 0.1 s) — lets the frontend test audio plumbing
const MOCK_AUDIO_BASE64 =
  "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADQADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM";

router.post("/tts", async (req, res): Promise<void> => {
  const parsed = SynthesizeSpeechBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { mode } = parsed.data;

  if (mode === "mock") {
    req.log.info({ mode: "mock" }, "TTS mock response");
    res.json(
      SynthesizeSpeechResponse.parse({
        audioBase64: MOCK_AUDIO_BASE64,
        audioMimeType: "audio/mpeg",
        mode: "mock",
        available: true,
        durationSeconds: 0.1,
      })
    );
    return;
  }

  // Live mode: requires TTS_PROVIDER_KEY (e.g. OpenAI TTS, ElevenLabs, etc.)
  const ttsKey = process.env["TTS_PROVIDER_KEY"];
  if (!ttsKey) {
    req.log.warn("TTS_PROVIDER_KEY not set, returning unavailable response");
    res.json(
      SynthesizeSpeechResponse.parse({
        mode: "fallback",
        available: false,
      })
    );
    return;
  }

  // TODO: call live TTS provider
  req.log.info("Live TTS requested but not yet integrated");
  res.status(501).json({ error: "Live TTS not yet configured" });
});

export default router;
