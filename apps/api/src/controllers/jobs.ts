import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

export async function createJob(req: Request, res: Response) {
  try {
    const { type, payload } = req.body;

    console.log("Saving job...");

    const job = await prisma.job.create({
      data: {
        type,
        payload,
        status: "QUEUED",
      },
    });

    console.log("Job saved:", job.id);
    
    await redis.lPush("queue:default", job.id);

    console.log("Pushed to Redis");

    res.status(201).json(job);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create job",
    });
  }
}