import { Router, type IRouter } from "express";
import {
  GenerateResponseBody,
  GenerateResponseResponse,
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

interface TemplateResponse {
  answerTextJa: string;
  answerTextEn: string;
  answerCaregiverNote?: string;
  followUpOptions: Array<{
    id: "repeat" | "simplify" | "caregiver_view" | "show_text";
    label: string;
    labelJa: string;
  }>;
  escalationFlag: boolean;
  escalationReason?: string;
}

const STANDARD_FOLLOW_UPS = [
  { id: "repeat" as const, label: "Repeat answer", labelJa: "もう一度聞く" },
  { id: "simplify" as const, label: "Simpler explanation", labelJa: "もっと簡単に" },
  { id: "caregiver_view" as const, label: "Caregiver view", labelJa: "介護者モード" },
  { id: "show_text" as const, label: "Show text", labelJa: "文字で見る" },
];

const RESPONSE_TEMPLATES: Record<Intent, TemplateResponse> = {
  explain_label: {
    answerTextJa:
      "この薬は、医師や薬剤師から指示された量と回数を守って服用してください。食後に飲むと胃への負担が少なくなります。わからないことは薬剤師にご相談ください。",
    answerTextEn:
      "Take this medicine as directed by your doctor or pharmacist. Taking it after meals helps reduce stomach discomfort. If you are unsure, please ask your pharmacist.",
    answerCaregiverNote:
      "Please verify dosage instructions on the label and confirm with the prescribing pharmacy. Watch for any allergic reactions.",
    followUpOptions: STANDARD_FOLLOW_UPS,
    escalationFlag: false,
  },
  explain_notice: {
    answerTextJa:
      "このお知らせには大切な情報が書かれています。ゆっくり読んで、わからない部分は家族や担当の方に確認してください。",
    answerTextEn:
      "This notice contains important information. Read it carefully and ask a family member or staff member if anything is unclear.",
    answerCaregiverNote:
      "Please review this notice together with the user and help clarify any action items or deadlines.",
    followUpOptions: STANDARD_FOLLOW_UPS,
    escalationFlag: false,
  },
  daily_utility: {
    answerTextJa:
      "ご質問の内容をお伝えします。最新の情報は地域の窓口やウェブサイトでご確認いただくことをお勧めします。",
    answerTextEn:
      "Here is an answer to your question. For the most current information, we recommend checking with your local office or official website.",
    followUpOptions: STANDARD_FOLLOW_UPS,
    escalationFlag: false,
  },
  repeat_answer: {
    answerTextJa: "もう一度、さきほどの内容をお伝えします。",
    answerTextEn: "Here is the previous answer again.",
    followUpOptions: [
      { id: "simplify" as const, label: "Simpler explanation", labelJa: "もっと簡単に" },
      { id: "caregiver_view" as const, label: "Caregiver view", labelJa: "介護者モード" },
      { id: "show_text" as const, label: "Show text", labelJa: "文字で見る" },
    ],
    escalationFlag: false,
  },
  simplify_answer: {
    answerTextJa: "もっと簡単にお伝えします。大切なことだけ、ゆっくり説明します。",
    answerTextEn: "Let me explain more simply. I will cover only the key points, slowly.",
    followUpOptions: [
      { id: "repeat" as const, label: "Repeat answer", labelJa: "もう一度聞く" },
      { id: "caregiver_view" as const, label: "Caregiver view", labelJa: "介護者モード" },
      { id: "show_text" as const, label: "Show text", labelJa: "文字で見る" },
    ],
    escalationFlag: false,
  },
  caregiver_handoff: {
    answerTextJa:
      "介護者モードに切り替えます。担当の方が詳しい情報をご確認いただけます。",
    answerTextEn:
      "Switching to caregiver mode. A caregiver or family member can review detailed information here.",
    answerCaregiverNote:
      "The user has requested caregiver assistance. Please review the conversation and provide appropriate support.",
    followUpOptions: [
      { id: "show_text" as const, label: "Show text", labelJa: "文字で見る" },
    ],
    escalationFlag: false,
  },
  unsupported: {
    answerTextJa:
      "申し訳ありません。このご質問にはお答えできません。かかりつけの医師や薬剤師にご相談いただくか、家族・担当の方にご確認ください。",
    answerTextEn:
      "I am sorry, I cannot answer this question. Please consult your doctor, pharmacist, or a family member.",
    followUpOptions: [
      { id: "caregiver_view" as const, label: "Caregiver view", labelJa: "介護者モード" },
      { id: "show_text" as const, label: "Show text", labelJa: "文字で見る" },
    ],
    escalationFlag: false,
  },
  safety_escalate: {
    answerTextJa:
      "これは緊急の状況かもしれません。すぐに救急（119番）に電話するか、かかりつけの医師や薬剤師にご連絡ください。一人で判断しないでください。",
    answerTextEn:
      "This may be an urgent situation. Please call emergency services (119) or contact your doctor or pharmacist immediately. Do not handle this alone.",
    answerCaregiverNote:
      "SAFETY ALERT: The user has asked a safety-sensitive question. Please assess the situation and contact medical services if necessary.",
    followUpOptions: [
      { id: "caregiver_view" as const, label: "Caregiver view", labelJa: "介護者モード" },
      { id: "show_text" as const, label: "Show text", labelJa: "文字で見る" },
    ],
    escalationFlag: true,
    escalationReason:
      "Safety-sensitive question detected. Escalating to emergency guidance.",
  },
};

async function generateWithGroq(
  transcript: string,
  intent: Intent,
  template: TemplateResponse
): Promise<{ answerTextJa: string; answerTextEn: string }> {
  const groqKey = process.env["GROQ_API_KEY"];
  if (!groqKey) {
    return {
      answerTextJa: template.answerTextJa,
      answerTextEn: template.answerTextEn,
    };
  }

  try {
    const systemPrompt = `You are a calm, accessible voice assistant for elderly Japanese users and their caregivers.
Your responses must be:
- Short (2-4 sentences max)
- Simple vocabulary (avoid medical jargon)
- Warm and reassuring in tone
- Not a diagnosis or legal advice
- Bilingual: respond with a "ja" field in Japanese and "en" field in English
Respond ONLY with JSON like: {"ja": "...", "en": "..."}`;

    const userPrompt = `Intent: ${intent}
User said: "${transcript}"
Template answer (use as a base, personalize for the exact question): "${template.answerTextJa}"`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 256,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as { ja?: string; en?: string };
    return {
      answerTextJa: parsed.ja ?? template.answerTextJa,
      answerTextEn: parsed.en ?? template.answerTextEn,
    };
  } catch {
    return {
      answerTextJa: template.answerTextJa,
      answerTextEn: template.answerTextEn,
    };
  }
}

router.post("/respond", async (req, res): Promise<void> => {
  const parsed = GenerateResponseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { transcript, intent, mode } = parsed.data;
  const template = RESPONSE_TEMPLATES[intent as Intent] ?? RESPONSE_TEMPLATES["unsupported"];

  let answerTextJa = template.answerTextJa;
  let answerTextEn = template.answerTextEn;

  if (mode === "live") {
    const groqResult = await generateWithGroq(transcript, intent as Intent, template);
    answerTextJa = groqResult.answerTextJa;
    answerTextEn = groqResult.answerTextEn;
  }

  const processingMode = mode === "live" && process.env["GROQ_API_KEY"]
    ? "live"
    : mode === "live"
    ? "fallback"
    : "mock";

  if (template.escalationFlag) {
    req.log.warn(
      { intent, transcript: transcript.slice(0, 80) },
      "Safety escalation triggered"
    );
  } else {
    req.log.info({ intent, processingMode }, "Response generated");
  }

  res.json(
    GenerateResponseResponse.parse({
      transcript,
      intent,
      confidenceScore: 0.85,
      answerTextJa,
      answerTextEn,
      answerCaregiverNote: template.answerCaregiverNote,
      followUpOptions: template.followUpOptions,
      escalationFlag: template.escalationFlag,
      escalationReason: template.escalationReason,
      processingMode,
    })
  );
});

export default router;
