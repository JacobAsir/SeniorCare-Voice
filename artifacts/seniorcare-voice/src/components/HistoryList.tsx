import { ConversationTurn } from "../lib/types";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoryListProps {
  history: ConversationTurn[];
  language: "ja" | "en";
}

export function HistoryList({ history, language }: HistoryListProps) {
  if (history.length <= 1) return null; // Only show if there are previous turns (excluding the current one)

  // Skip the first item as it's the current turn shown in AssistantResponse
  const pastTurns = history.slice(1);

  const playAudio = (audioBase64: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
    audio.play();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-16 space-y-6">
      <h3 className="text-lg font-bold text-muted-foreground border-b border-border pb-2">
        {language === "ja" ? "過去の会話" : "Conversation History"}
      </h3>
      
      <div className="space-y-8">
        {pastTurns.map((turn) => (
          <div key={turn.id} className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex justify-end">
              <div className="bg-secondary text-secondary-foreground px-4 py-3 rounded-2xl rounded-tr-none max-w-[80%] text-sm">
                {turn.transcript}
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-card text-card-foreground border border-card-border px-5 py-4 rounded-2xl rounded-tl-none max-w-[90%] shadow-sm relative">
                 <p className="text-base leading-relaxed mb-3">
                   {language === "ja" ? turn.replyJa : turn.replyEn}
                 </p>
                 {turn.audioBase64 && (
                   <Button
                     variant="ghost"
                     size="icon"
                     className="absolute -right-12 top-2 text-primary hover:bg-primary/10 rounded-full h-10 w-10"
                     onClick={() => playAudio(turn.audioBase64!)}
                     title={language === "ja" ? "再生" : "Play"}
                   >
                     <Volume2 className="w-5 h-5" />
                   </Button>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
