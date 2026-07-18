import "dotenv/config";
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";
import { QUEUES } from "./config/queues";

async function startScheduler() {
    console.log("⏰ Scheduler started...");

    while (true) {

        try {// Find due jobs
            const jobs = await prisma.job.findMany({
                where: {
                    status: "SCHEDULED",
                    runAt: {
                        lte: new Date(),
                    },
                },
            });

            if (jobs.length > 0) {
                console.log(`Found ${jobs.length} scheduled jobs`);
            }            // Push them to Redis

            for (const job of jobs) {

                await redis.lPush(
                    QUEUES[job.priority],
                    job.id
                );



                await prisma.job.update({
                    where: {
                        id: job.id,
                    },
                    data: {
                        status: "QUEUED",
                    },
                });

                console.log(`Queued ${job.id}`);

            }
        } catch (error) {
            console.error("Scheduler error:", error);
        }

        // Wait 5 seconds
        const sleep = (ms: number) =>
            new Promise(resolve => setTimeout(resolve, ms));

        await sleep(5000);

    }
    
}

startScheduler();