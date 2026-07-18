import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { QUEUES } from "../config/queues";

export async function createJob(req: Request, res: Response) {
    try {
        const {
            type,
            payload,
            priority = "MEDIUM",
            delay = 0,
        }: {
            type: string;
            payload: unknown;
            priority?: QueuePriority;
            delay?: number;
        } = req.body;

        console.log("Saving job...");

        if (!(priority in QUEUES)) {
            return res.status(400).json({
                error: "Invalid priority",
            });
        }

        const status = delay > 0 ? "SCHEDULED" : "QUEUED";

        const runAt =
            delay > 0
                ? new Date(Date.now() + delay)
                : null;

        const job = await prisma.job.create({
            data: {
                type,
                payload,
                priority,
                status,
                runAt,
            },
        });

        console.log("Job saved:", job.id);

        if (status === "QUEUED") {
            await redis.lPush(QUEUES[priority], job.id);

            console.log("Pushed to Redis");
        }

        res.status(201).json(job);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create job",
        });
    }
}