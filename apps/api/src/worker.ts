import "dotenv/config";
import { redis } from "./lib/redis";
import { prisma } from "./lib/prisma";
import { sleep } from "./utils/sleep";

async function startWorker() {
    console.log("👷 Worker started...");

    while (true) {
        const result = await redis.brPop("queue:default", 0);
        const jobId = result.element;

        try {
            // Everything related to this one job
            console.log("Received Job:", jobId);

            const job = await prisma.job.findUnique({
                where: {
                    id: jobId,
                },
            });

            if (!job) {
                console.log(`Job ${jobId} not found. Skipping...`);
                continue;
            }

            await prisma.job.update({
                where: {
                    id: jobId,
                },
                data: {
                    status: "PROCESSING",
                },
            });

            console.log("Job is processing...");
            throw new Error("Testing failure");
            await sleep(3000);

            await prisma.job.update({
                where: {
                    id: jobId,
                },
                data: {
                    status: "COMPLETED",
                },
            });

            console.log("Completed!");

            console.log(job);

        } catch (error) {
            // Handle this one job's failure
            const updatedJob = await prisma.job.update({
                where: {
                    id: jobId,
                },
                data: {
                    retryCount: {
                        increment: 1
                    },
                },
            });

            const MAX_RETRIES = 3;

            if (updatedJob.retryCount < MAX_RETRIES) {
                console.log("Retrying job...");

                await prisma.job.update({
                    where: {
                        id: jobId,
                    },
                    data: {
                        status: "QUEUED",
                    },
                });

                await redis.lPush("queue:default", jobId);
            }

            else {
                await prisma.job.update({
                    where: {
                        id: jobId,
                    },
                    data: {
                        status: "FAILED",
                    },
                });

                await redis.lPush("queue:dead", jobId);

                console.log("Moved job to Dead Letter Queue");
            }


        }



    }
}

startWorker();