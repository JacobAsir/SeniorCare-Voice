import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { AudioRecorderState } from "../hooks/useAudioRecorder";

interface MicButtonProps {
  recorderState: AudioRecorderState;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function MicButton({ recorderState, onStart, onStop, disabled }: MicButtonProps) {
  const isRecording = recorderState === "recording";
  
  // Handling tap and hold
  const [isPressing, setIsPressing] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsPressing(true);
    if (!isRecording) {
      onStart();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsPressing(false);
    if (isRecording) {
      onStop();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 my-12">
      <div className="relative flex items-center justify-center w-40 h-40">
        {/* Ripples when recording */}
        <AnimatePresence>
          {isRecording && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />
            </>
          )}
        </AnimatePresence>

        <motion.button
          className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-colors
            ${disabled ? 'bg-muted cursor-not-allowed opacity-50' : 
              isRecording ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
          `}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          whileTap={disabled ? {} : { scale: 0.95 }}
          animate={!isRecording && !disabled ? { scale: [1, 1.05, 1] } : {}}
          transition={!isRecording && !disabled ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : {}}
          aria-label={isRecording ? "録音停止" : "録音開始"}
        >
          {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-12 h-12" />}
        </motion.button>
      </div>

      <p className="text-lg font-medium text-foreground text-center h-8">
        {isRecording 
          ? "お話しください... (離して送信)" 
          : "マイクを押しながら話す\n(またはタップして開始/停止)"}
      </p>
    </div>
  );
}
