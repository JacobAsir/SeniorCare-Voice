import { Router, type IRouter } from "express";
import {
  ClassifyIntentBody,
  ClassifyIntentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type Intent =
  | "explain_label"
  | "explain_notice"
  | "daily_utility"
  | "repeat_answer"
  | "simplify_answer"
  | "caregiver_handoff"
  | "unsupported"
  | "safety_escalate";

interface ClassificationRule {
  intent: Intent;
  patterns: RegExp[];
  safetyEscalate?: boolean;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // Safety-sensitive patterns — must come first
  {
    intent: "safety_escalate",
    safetyEscalate: true,
    patterns: [
      /大量|過剰|死に?たい|自殺|毒|危険.*飲|飲.*危険/,
      /overdose|suicid|poison|dangerous.*dose/i,
      /緊急|救急|倒れ|意識|呼吸.*止/,
    ],
  },
  // Label / medicine explanation
  {
    intent: "explain_label",
    patterns: [
      /薬.*飲み?方|飲み?方.*薬|服用|用法|用量|ラベル|効能|副作用/,
      /medicine|medication|label|dosage|side effect|prescription/i,
    ],
  },
  // Notice / document explanation
  {
    intent: "explain_notice",
    patterns: [
      /お知らせ|通知|書類|紙|文書|通達|案内.*意味|意味.*案内/,
      /notice|document|letter|announcement|flyer/i,
    ],
  },
  // Repeat
  {
    intent: "repeat_answer",
    patterns: [
      /もう一度|繰り返し|もう一回|再度|聞き直し/,
      /repeat|again|once more/i,
    ],
  },
  // Simplify
  {
    intent: "simplify_answer",
    patterns: [
      /もっと簡単|わかりやすく|簡単に|平易|簡潔/,
      /simpler|simplify|easier|more simple/i,
    ],
  },
  // Caregiver handoff
  {
    intent: "caregiver_handoff",
    patterns: [
      /介護者|家族|ケア|担当者|担当|看護|スタッフ/,
      /caregiver|nurse|staff|family|carer/i,
    ],
  },
  // Daily utility
  {
    intent: "daily_utility",
    patterns: [
      /天気|時間|今日|明日|予定|場所|営業|開院|休み|交通/,
      /weather|time|today|tomorrow|schedule|location|open|close|bus|train/i,
    ],
  },
];

function classifyText(transcript: string): {
  intent: Intent;
  confidence: number;
  isSafe: boolean;
  isSupported: boolean;
  escalationReason?: string;
} {
  for (const rule of CLASSIFICATION_RULES) {
    const matched = rule.patterns.some((p) => p.test(transcript));
    if (matched) {
      if (rule.safetyEscalate) {
        return {
          intent: "safety_escalate",
          confidence: 0.95,
          isSafe: false,
          isSupported: true,
          escalationReason:
            "This question involves a safety-sensitive topic. Please contact a medical professional or call emergency services.",
        };
      }
      return {
        intent: rule.intent,
        confidence: 0.85,
        isSafe: true,
        isSupported: true,
      };
    }
  }

  // No rule matched
  return {
    intent: "unsupported",
    confidence: 0.7,
    isSafe: true,
    isSupported: false,
  };
}

router.post("/classify", async (req, res): Promise<void> => {
  const parsed = ClassifyIntentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { transcript } = parsed.data;
  const result = classifyText(transcript);

  req.log.info(
    { intent: result.intent, confidence: result.confidence, isSafe: result.isSafe },
    "Intent classified"
  );

  res.json(ClassifyIntentResponse.parse(result));
});

export default router;
