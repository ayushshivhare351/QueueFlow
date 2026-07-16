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
        }: {
            type: string;
            payload: unknown;
            priority?: QueuePriority;
        } = req.body;

        console.log("Saving job...");

        if (!(priority in QUEUES)) {
            return res.status(400).json({
                error: "Invalid priority",
            });
        }

        const job = await prisma.job.create({
            data: {
                type,
                payload,
                priority,
                status: "QUEUED",
            },
        });

        console.log("Job saved:", job.id);

        await redis.lPush(QUEUES[priority], job.id);

        console.log("Pushed to Redis");

        res.status(201).json(job);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create job",
        });
    }
}