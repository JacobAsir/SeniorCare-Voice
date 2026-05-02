import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const mode = process.env.SENIORCARE_MODE === "live" ? "live" : "mock";
  const data = HealthCheckResponse.parse({ status: "ok", mode });
  res.json(data);
});

export default router;
