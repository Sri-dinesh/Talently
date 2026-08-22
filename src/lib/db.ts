// src/lib/db.ts
import { prisma } from "./prisma";
import type { Task, User, TaskStatus } from "@/types/task";

// In-memory store fallback for development / offline / unconfigured Postgres
const memoryStore = {
  tasks: new Map<string, Task>(),
  users: new Map<string, User>(),
};

// Seed with default demo tasks and available providers
if (memoryStore.tasks.size === 0) {
  const demoTask1: Task = {
    id: "task_demo_01",
    onChainId: "1",
    title: "Test onboarding flow on mobile browser",
    description:
      "Install the build, navigate through the onboarding screen, create a test account, and report any UI friction or bugs with severity level.",
    category: "Testing",
    skills: ["App Testing", "QA", "Mobile"],
    rewardWei: "50000000000000000", // 0.05 MON
    estimatedMinutes: 10,
    status: "OPEN",
    requesterAddress: "0x71c841366144da79f04901968846c2d1b11e49a1",
    providerAddress: null,
    resultText: null,
    resultSeverity: null,
    resultAttachmentUrl: null,
    createTxHash: "0x3f5b72189a08e09f5832a819b16541f98bc19d3810143a4e930f7b4c2b9a8e10",
    acceptTxHash: null,
    submitTxHash: null,
    approveTxHash: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const demoTask2: Task = {
    id: "task_demo_02",
    onChainId: "2",
    title: "Verify smart contract escrow reentrancy guard",
    description:
      "Review the Checks-Effects-Interactions pattern in approveTask and cancelTask to ensure state zeroing occurs before external value transfer.",
    category: "Technical",
    skills: ["Solidity", "Security", "Auditing"],
    rewardWei: "100000000000000000", // 0.1 MON
    estimatedMinutes: 15,
    status: "OPEN",
    requesterAddress: "0x89b12c4182903810934812398412984128941234",
    providerAddress: null,
    resultText: null,
    resultSeverity: null,
    resultAttachmentUrl: null,
    createTxHash: "0x8a92b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f80",
    acceptTxHash: null,
    submitTxHash: null,
    approveTxHash: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.tasks.set(demoTask1.id, demoTask1);
  memoryStore.tasks.set(demoTask2.id, demoTask2);
}

export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
      (url.startsWith("postgresql://") || url.startsWith("postgres://")) &&
      !url.includes("[YOUR-PASSWORD]")
  );
}

export const db = {
  async getTasks(filters?: {
    status?: TaskStatus;
    category?: string;
    skill?: string;
    requesterAddress?: string;
    providerAddress?: string;
    limit?: number;
  }): Promise<Task[]> {
    if (isDbConfigured()) {
      try {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.category && filters.category !== "All")
          where.category = filters.category;
        if (filters?.skill) where.skills = { has: filters.skill };
        if (filters?.requesterAddress)
          where.requesterAddress = filters.requesterAddress;
        if (filters?.providerAddress)
          where.providerAddress = filters.providerAddress;

        const tasks = await prisma.task.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: filters?.limit || 50,
          include: {
            requester: true,
            provider: true,
          },
        });

        return tasks.map((t) => ({
          ...t,
          onChainId: t.onChainId ? t.onChainId.toString() : null,
        })) as Task[];
      } catch (err) {
        console.warn("Prisma query failed, using memory store fallback:", err);
      }
    }

    // Fallback: in-memory store
    let tasks = Array.from(memoryStore.tasks.values());
    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }
    if (filters?.category && filters.category !== "All") {
      tasks = tasks.filter((t) => t.category === filters.category);
    }
    if (filters?.skill) {
      tasks = tasks.filter((t) => t.skills?.includes(filters.skill!));
    }
    if (filters?.requesterAddress) {
      tasks = tasks.filter(
        (t) => t.requesterAddress.toLowerCase() === filters.requesterAddress!.toLowerCase()
      );
    }
    if (filters?.providerAddress) {
      tasks = tasks.filter(
        (t) => t.providerAddress?.toLowerCase() === filters.providerAddress!.toLowerCase()
      );
    }

    return tasks.slice(0, filters?.limit || 50);
  },

  async getTask(id: string): Promise<Task | null> {
    if (isDbConfigured()) {
      try {
        const task = await prisma.task.findUnique({
          where: { id },
          include: { requester: true, provider: true },
        });
        if (task) {
          return {
            ...task,
            onChainId: task.onChainId ? task.onChainId.toString() : null,
          } as Task;
        }
      } catch (err) {
        console.warn("Prisma findUnique failed, using memory fallback:", err);
      }
    }

    return memoryStore.tasks.get(id) || null;
  },

  async createTask(data: {
    title: string;
    description: string;
    category?: string;
    skills?: string[];
    rewardWei: string;
    estimatedMinutes?: number | null;
    requesterAddress: string;
  }): Promise<Task> {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (isDbConfigured()) {
      try {
        await prisma.user.upsert({
          where: { address: data.requesterAddress.toLowerCase() },
          update: {},
          create: {
            address: data.requesterAddress.toLowerCase(),
            skills: [],
          },
        });

        const created = await prisma.task.create({
          data: {
            id,
            title: data.title,
            description: data.description,
            category: data.category || "Testing",
            skills: data.skills || [],
            rewardWei: data.rewardWei,
            estimatedMinutes: data.estimatedMinutes || 15,
            status: "PENDING_CHAIN",
            requesterAddress: data.requesterAddress.toLowerCase(),
          },
        });

        return {
          ...created,
          onChainId: null,
        } as Task;
      } catch (err) {
        console.warn("Prisma create failed, falling back to memory store:", err);
      }
    }

    const memoryTask: Task = {
      id,
      onChainId: null,
      title: data.title,
      description: data.description,
      category: data.category || "Testing",
      skills: data.skills || [],
      rewardWei: data.rewardWei,
      estimatedMinutes: data.estimatedMinutes || 15,
      status: "PENDING_CHAIN",
      requesterAddress: data.requesterAddress.toLowerCase(),
      providerAddress: null,
      resultText: null,
      resultSeverity: null,
      resultAttachmentUrl: null,
      createTxHash: null,
      acceptTxHash: null,
      submitTxHash: null,
      approveTxHash: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryStore.tasks.set(id, memoryTask);
    return memoryTask;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    if (isDbConfigured()) {
      try {
        const prismaUpdates: any = { ...updates };
        if (updates.onChainId !== undefined) {
          prismaUpdates.onChainId = updates.onChainId
            ? BigInt(updates.onChainId.toString())
            : null;
        }

        const updated = await prisma.task.update({
          where: { id },
          data: prismaUpdates,
        });

        return {
          ...updated,
          onChainId: updated.onChainId ? updated.onChainId.toString() : null,
        } as Task;
      } catch (err) {
        console.warn("Prisma update failed, updating memory store:", err);
      }
    }

    const existing = memoryStore.tasks.get(id);
    if (!existing) return null;

    const merged: Task = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    memoryStore.tasks.set(id, merged);
    return merged;
  },

  async getUser(address: string): Promise<User> {
    const normalized = address.toLowerCase();

    if (isDbConfigured()) {
      try {
        const user = await prisma.user.findUnique({
          where: { address: normalized },
        });
        if (user) return user as User;
      } catch (err) {
        console.warn("Prisma getUser failed, using memory store:", err);
      }
    }

    let memoryUser = memoryStore.users.get(normalized);
    if (!memoryUser) {
      memoryUser = {
        address: normalized,
        displayName: null,
        skills: ["QA", "Testing"],
        tasksCompleted: 1,
        tasksApproved: 1,
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.users.set(normalized, memoryUser);
    }

    return memoryUser;
  },

  async updateUser(
    address: string,
    updates: Partial<User>
  ): Promise<User> {
    const normalized = address.toLowerCase();

    if (isDbConfigured()) {
      try {
        const updated = await prisma.user.upsert({
          where: { address: normalized },
          update: updates,
          create: {
            address: normalized,
            displayName: updates.displayName || null,
            skills: updates.skills || [],
            isAvailable: updates.isAvailable || false,
          },
        });
        return updated as User;
      } catch (err) {
        console.warn("Prisma updateUser failed, using memory store:", err);
      }
    }

    const current = await this.getUser(normalized);
    const merged: User = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    memoryStore.users.set(normalized, merged);
    return merged;
  },
};
