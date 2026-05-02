import { ConversationTurn } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Volume2, Play } from "lucide-react";
import { motion } from "framer-motion";

interface AssistantResponseProps {
  turn: Partial<ConversationTurn>;
  language: "ja" | "en";
}

export function AssistantResponse({ turn, language }: AssistantResponseProps) {
  if (!turn) return null;

  const playAudio = () => {
    if (turn.audioBase64) {
      const audio = new Audio(`data:audio/mp3;base64,${turn.audioBase64}`);
      audio.play();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto space-y-6 mt-8"
    >
      {turn.transcript && (
        <div className="flex justify-end">
          <div className="bg-secondary text-secondary-foreground px-6 py-4 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm">
            <p className="text-lg leading-relaxed">{turn.transcript}</p>
          </div>
        </div>
      )}

      {(turn.replyJa || turn.replyEn) && (
        <div className="flex justify-start">
          <div className="bg-card text-card-foreground border border-card-border px-6 py-5 rounded-2xl rounded-tl-none max-w-[95%] shadow-md space-y-4">
            
            {turn.intentLabelJa && language === "ja" && (
               <span className="inline-block px-3 py-1 bg-accent/10 text-accent font-medium text-xs rounded-full mb-2">
                 {turn.intentLabelJa}
               </span>
            )}

            <p className="text-xl md:text-2xl leading-loose font-medium text-foreground whitespace-pre-wrap">
              {language === "ja" ? turn.replyJa : turn.replyEn}
            </p>
            
            {turn.audioBase64 && (
              <div className="pt-4 flex justify-end border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={playAudio}
                  className="text-primary hover:text-primary hover:bg-primary/10 gap-2 h-10 px-4 rounded-full"
                >
                  <Volume2 className="w-5 h-5" />
                  <span className="font-medium text-base">もう一度聞く</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
