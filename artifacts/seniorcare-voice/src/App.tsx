import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, RefreshCw } from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";

import NotFound from "@/pages/not-found";
import { MicButton } from "@/components/MicButton";
import { PipelineVisualizer } from "@/components/PipelineVisualizer";
import { DemoPrompts } from "@/components/DemoPrompts";
import { AssistantResponse } from "@/components/AssistantResponse";
import { HistoryList } from "@/components/HistoryList";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSeniorCarePipeline } from "@/hooks/useSeniorCarePipeline";
import { Language } from "@/lib/types";

const queryClient = new QueryClient();

function Home() {
  const [language, setLanguage] = useState<Language>("ja");
  const { data: healthData } = useHealthCheck();
  
  const isMockMode = !healthData?.mode || healthData.mode === "mock";

  const {
    state: recorderState,
    audioBase64,
    startRecording,
    stopRecording,
    reset: resetRecorder
  } = useAudioRecorder();

  const {
    stage: pipelineStage,
    currentTurn,
    history,
    processAudio,
    runDemoPrompt,
    resetPipeline
  } = useSeniorCarePipeline();

  // Trigger pipeline when audio finishes recording
  useEffect(() => {
    if (audioBase64 && pipelineStage === "idle") {
      processAudio(audioBase64, language);
      resetRecorder();
    }
  }, [audioBase64, pipelineStage, processAudio, language, resetRecorder]);

  const handleDemoPrompt = (text: string) => {
    if (recorderState !== "idle" || (pipelineStage !== "idle" && pipelineStage !== "complete" && pipelineStage !== "error")) {
      return;
    }
    runDemoPrompt(text, language);
  };

  const handleReset = () => {
    resetRecorder();
    resetPipeline();
  };

  const isBusy = recorderState !== "idle" || (pipelineStage !== "idle" && pipelineStage !== "complete" && pipelineStage !== "error");

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans pb-24">
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-primary tracking-tight">SeniorCare Voice</h1>
          {isMockMode && (
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 px-2 py-0.5 text-xs font-medium">
              Mock Mode
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-10 px-3 rounded-full"
            onClick={() => setLanguage(l => l === "ja" ? "en" : "ja")}
          >
            <Globe className="w-4 h-4 mr-2" />
            <span className="font-medium">{language === "ja" ? "English" : "日本語"}</span>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-border text-muted-foreground hover:text-foreground"
            onClick={handleReset}
            title="Reset"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 flex flex-col">
        
        <MicButton 
          recorderState={recorderState}
          onStart={startRecording}
          onStop={stopRecording}
          disabled={pipelineStage !== "idle" && pipelineStage !== "complete" && pipelineStage !== "error"}
        />

        <PipelineVisualizer stage={pipelineStage} language={language} />

        {currentTurn && (
          <AssistantResponse turn={currentTurn} language={language} />
        )}

        {pipelineStage === "idle" && !currentTurn && (
          <DemoPrompts 
            onSelectPrompt={handleDemoPrompt} 
            language={language}
            disabled={isBusy}
          />
        )}

        <HistoryList history={history} language={language} />

      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
