import { useState, useCallback, useRef } from "react";

export type AudioRecorderState = "idle" | "recording" | "processing";

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>("idle");
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Extract base64 without prefix
          const base64Data = base64String.split(",")[1];
          setAudioBase64(base64Data);
          setState("idle");
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setState("recording");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("マイクへのアクセスが拒否されました。設定を確認してください。(Microphone access denied)");
      setState("idle");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      setState("processing");
    }
  }, [state]);

  const reset = useCallback(() => {
    setAudioBase64(null);
    setError(null);
    setState("idle");
  }, []);

  return {
    state,
    audioBase64,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}
