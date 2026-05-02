import { useState, useCallback } from "react";
import { useTranscribeAudio, useClassifyIntent, useGenerateResponse, useSynthesizeSpeech, TranscribeRequestMode, RespondRequestMode, TtsRequestMode } from "@workspace/api-client-react";
import { PipelineStage, ConversationTurn, Language } from "../lib/types";
import { useToast } from "@/hooks/use-toast";

export function useSeniorCarePipeline() {
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [currentTurn, setCurrentTurn] = useState<Partial<ConversationTurn> | null>(null);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const { toast } = useToast();

  const transcribeMutation = useTranscribeAudio();
  const classifyMutation = useClassifyIntent();
  const respondMutation = useGenerateResponse();
  const ttsMutation = useSynthesizeSpeech();

  const handlePipelineError = (error: any, stepName: string) => {
    console.error(`Pipeline error at ${stepName}:`, error);
    setStage("error");
    toast({
      title: "エラーが発生しました (Error)",
      description: "申し訳ありません。もう一度お試しください。 (Please try again.)",
      variant: "destructive",
    });
  };

  const processAudio = useCallback(async (audioBase64: string, language: Language) => {
    setStage("transcribe");
    setCurrentTurn({ id: Date.now().toString() });

    try {
      // 1. Transcribe
      const transcribeRes = await transcribeMutation.mutateAsync({
        data: {
          mode: TranscribeRequestMode.mock,
          audioBase64,
        }
      });
      
      const transcript = transcribeRes.transcript;
      setCurrentTurn(prev => ({ ...prev, transcript }));

      await processText(transcript, language, Date.now().toString());

    } catch (err) {
      handlePipelineError(err, "transcribe");
    }
  }, [transcribeMutation]);

  const processText = useCallback(async (text: string, language: Language, turnId: string) => {
    try {
      setStage("classify");
      setCurrentTurn(prev => ({ ...prev, id: prev?.id || turnId, transcript: text }));

      // 2. Classify
      const classifyRes = await classifyMutation.mutateAsync({
        data: {
          transcript: text,
        }
      });
      
      setCurrentTurn(prev => ({ 
        ...prev, 
        intent: classifyRes.intent, 
      }));

      setStage("respond");
      
      // 3. Respond
      const respondRes = await respondMutation.mutateAsync({
        data: {
          transcript: text,
          intent: classifyRes.intent as any,
          mode: RespondRequestMode.mock
        }
      });

      setCurrentTurn(prev => ({
        ...prev,
        replyJa: respondRes.answerTextJa,
        replyEn: respondRes.answerTextEn
      }));

      setStage("tts");

      // 4. TTS
      const ttsRes = await ttsMutation.mutateAsync({
        data: {
          text: language === "ja" ? respondRes.answerTextJa : respondRes.answerTextEn,
          mode: TtsRequestMode.mock,
          language: language,
        }
      });

      const completeTurn: ConversationTurn = {
        id: turnId,
        transcript: text,
        intent: classifyRes.intent,
        replyJa: respondRes.answerTextJa,
        replyEn: respondRes.answerTextEn,
        audioBase64: ttsRes.audioBase64
      };

      setCurrentTurn(completeTurn);
      setHistory(prev => [completeTurn, ...prev]);
      setStage("complete");

      // Auto-play audio
      if (ttsRes.audioBase64) {
        const audio = new Audio(`data:${ttsRes.audioMimeType || 'audio/mp3'};base64,${ttsRes.audioBase64}`);
        audio.play().catch(e => console.error("Auto-play blocked:", e));
      }

    } catch (err) {
      handlePipelineError(err, "processing");
    }
  }, [classifyMutation, respondMutation, ttsMutation]);

  const runDemoPrompt = useCallback((promptText: string, language: Language) => {
    processText(promptText, language, Date.now().toString());
  }, [processText]);

  const resetPipeline = useCallback(() => {
    setStage("idle");
    setCurrentTurn(null);
  }, []);

  return {
    stage,
    currentTurn,
    history,
    processAudio,
    runDemoPrompt,
    resetPipeline
  };
}
