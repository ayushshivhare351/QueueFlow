import { Router } from "express";
import { createJob } from "../controllers/jobs";

const router = Router();

router.post("/", createJob);

export default router;