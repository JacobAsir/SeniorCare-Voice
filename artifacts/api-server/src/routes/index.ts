import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transcribeRouter from "./transcribe";
import classifyRouter from "./classify";
import respondRouter from "./respond";
import ttsRouter from "./tts";
import demoRouter from "./demo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transcribeRouter);
router.use(classifyRouter);
router.use(respondRouter);
router.use(ttsRouter);
router.use(demoRouter);

export default router;
