import { PipelineStage } from "../lib/types";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Mic, Brain, MessageSquare, Volume2 } from "lucide-react";

interface PipelineVisualizerProps {
  stage: PipelineStage;
  language: "ja" | "en";
}

export function PipelineVisualizer({ stage, language }: PipelineVisualizerProps) {
  const steps = [
    { 
      id: "transcribe", 
      icon: Mic, 
      labelJa: "聞き取り中", 
      labelEn: "Listening" 
    },
    { 
      id: "classify", 
      icon: Brain, 
      labelJa: "理解中", 
      labelEn: "Understanding" 
    },
    { 
      id: "respond", 
      icon: MessageSquare, 
      labelJa: "回答作成中", 
      labelEn: "Thinking" 
    },
    { 
      id: "tts", 
      icon: Volume2, 
      labelJa: "音声準備中", 
      labelEn: "Speaking" 
    },
  ];

  if (stage === "idle" || stage === "complete" || stage === "error") {
    return null;
  }

  const currentStepIndex = steps.findIndex(s => s.id === stage);

  return (
    <div className="w-full max-w-md mx-auto py-8 px-6 bg-card border border-card-border rounded-2xl shadow-sm my-6">
      <div className="flex justify-between items-center relative">
        {/* Connecting line */}
        <div className="absolute left-6 right-6 top-6 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        {steps.map((step, index) => {
          const isPast = currentStepIndex > index;
          const isCurrent = currentStepIndex === index;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  isPast 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : isCurrent 
                      ? "bg-background border-primary text-primary" 
                      : "bg-background border-muted text-muted-foreground"
                }`}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={isCurrent ? { repeat: Infinity, duration: 2 } : {}}
              >
                {isPast ? <CheckCircle2 className="w-6 h-6" /> : isCurrent ? <Loader2 className="w-6 h-6 animate-spin" /> : <Icon className="w-6 h-6" />}
              </motion.div>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                isCurrent ? "text-foreground" : isPast ? "text-foreground" : "text-muted-foreground"
              }`}>
                {language === "ja" ? step.labelJa : step.labelEn}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
