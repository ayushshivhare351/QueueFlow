import "dotenv/config";
import { redis } from "./lib/redis";
import { prisma } from "./lib/prisma";

async function startWorker() {
    console.log("👷 Worker started...");

    while (true) {
        const result = await redis.brPop("queue:default", 0);
        const jobId = result.element;
        
        console.log("Received Job:", jobId);

        const job = await prisma.job.findUnique({
            where: {
                id: jobId,
            },
        });

        console.log(job);
    }
}

startWorker();