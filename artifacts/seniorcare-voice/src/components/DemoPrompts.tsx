import { useGetDemoPrompts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DemoPromptsProps {
  onSelectPrompt: (text: string) => void;
  language: "ja" | "en";
  disabled?: boolean;
}

export function DemoPrompts({ onSelectPrompt, language, disabled }: DemoPromptsProps) {
  const { data, isLoading, isError } = useGetDemoPrompts();

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 mt-12">
        <Skeleton className="h-8 w-48 bg-muted rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 bg-card rounded-xl" />
          <Skeleton className="h-24 bg-card rounded-xl" />
          <Skeleton className="h-24 bg-card rounded-xl" />
          <Skeleton className="h-24 bg-card rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data?.categories) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 mt-12">
      <h2 className="text-xl font-bold text-foreground text-center">
        {language === "ja" ? "お試し用の質問" : "Try a demo prompt"}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.categories.map((category) => (
          <div key={category.id} className="space-y-3 bg-card p-5 rounded-2xl border border-card-border shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {language === "ja" ? category.labelJa : category.label}
            </h3>
            <div className="flex flex-col gap-2">
              {category.prompts.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  className="h-auto py-3 px-4 justify-start text-left bg-background hover:bg-secondary border-border whitespace-normal hover-elevate transition-all"
                  onClick={() => onSelectPrompt(language === "ja" ? prompt.textJa : prompt.textEn)}
                  disabled={disabled}
                >
                  <span className="text-base text-foreground font-medium leading-relaxed">
                    {language === "ja" ? prompt.textJa : prompt.textEn}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
