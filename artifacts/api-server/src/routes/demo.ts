import { Router, type IRouter } from "express";
import { GetDemoPromptsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/demo-prompts", async (_req, res): Promise<void> => {
  res.json(
    GetDemoPromptsResponse.parse({
      categories: [
        {
          id: "medicine",
          label: "Medicine & Labels",
          labelJa: "薬・ラベル",
          prompts: [
            {
              id: "mock_label",
              textJa: "この薬の飲み方を教えてください",
              textEn: "How should I take this medicine?",
              intent: "explain_label",
            },
            {
              id: "mock_label_2",
              textJa: "この薬の副作用はありますか",
              textEn: "Does this medicine have side effects?",
              intent: "explain_label",
            },
          ],
        },
        {
          id: "notices",
          label: "Notices & Documents",
          labelJa: "お知らせ・書類",
          prompts: [
            {
              id: "mock_notice",
              textJa: "このお知らせの内容を教えてください",
              textEn: "Please explain what this notice says.",
              intent: "explain_notice",
            },
          ],
        },
        {
          id: "daily",
          label: "Daily Questions",
          labelJa: "日常の質問",
          prompts: [
            {
              id: "mock_daily",
              textJa: "今日の天気はどうですか",
              textEn: "What is the weather like today?",
              intent: "daily_utility",
            },
            {
              id: "mock_daily_2",
              textJa: "近くの病院はどこですか",
              textEn: "Where is the nearest hospital?",
              intent: "daily_utility",
            },
          ],
        },
        {
          id: "clarify",
          label: "Clarification",
          labelJa: "聞き直し・確認",
          prompts: [
            {
              id: "mock_repeat",
              textJa: "もう一度言ってください",
              textEn: "Please say that again.",
              intent: "repeat_answer",
            },
            {
              id: "mock_simplify",
              textJa: "もっと簡単に説明してください",
              textEn: "Please explain more simply.",
              intent: "simplify_answer",
            },
          ],
        },
      ],
    })
  );
});

export default router;
