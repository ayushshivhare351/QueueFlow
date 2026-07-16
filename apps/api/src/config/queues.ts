export const QUEUES = {
    HIGH: "queue:high",
    MEDIUM: "queue:medium",
    LOW: "queue:low",
} as const;

export type QueuePriority = keyof typeof QUEUES;