// src/lib/db.ts
import { prisma } from "./prisma";
import type { Task, User, TaskStatus } from "@/types/task";

// Global in-memory store shared across all Next.js server route closures
const globalForMemory = globalThis as unknown as {
  memoryTasks: Map<string, Task> | undefined;
  memoryUsers: Map<string, User> | undefined;
};

const memoryTasks = globalForMemory.memoryTasks ?? new Map<string, Task>();
const memoryUsers = globalForMemory.memoryUsers ?? new Map<string, User>();

globalForMemory.memoryTasks = memoryTasks;
globalForMemory.memoryUsers = memoryUsers;

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
          where.requesterAddress = filters.requesterAddress.toLowerCase();
        if (filters?.providerAddress)
          where.providerAddress = filters.providerAddress.toLowerCase();

        const tasks = await prisma.task.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: filters?.limit || 50,
          include: {
            requester: true,
            provider: true,
          },
        });

        // Sync to memory
        for (const t of tasks) {
          const formatted = {
            ...t,
            onChainId: t.onChainId ? t.onChainId.toString() : null,
          } as Task;
          memoryTasks.set(t.id, formatted);
        }

        return tasks.map((t) => ({
          ...t,
          onChainId: t.onChainId ? t.onChainId.toString() : null,
        })) as Task[];
      } catch (err) {
        console.warn("Prisma query failed, using memory store fallback:", err);
      }
    }

    // Fallback: global in-memory store
    let tasks = Array.from(memoryTasks.values());
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
        (t) =>
          t.requesterAddress.toLowerCase() ===
          filters.requesterAddress!.toLowerCase()
      );
    }
    if (filters?.providerAddress) {
      tasks = tasks.filter(
        (t) =>
          t.providerAddress?.toLowerCase() ===
          filters.providerAddress!.toLowerCase()
      );
    }

    // Sort newest first
    tasks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return tasks.slice(0, filters?.limit || 50);
  },

  async getTask(id: string): Promise<Task | null> {
    // Check in-memory store first for instant lookup
    const cached = memoryTasks.get(id);

    if (isDbConfigured()) {
      try {
        const task = await prisma.task.findUnique({
          where: { id },
          include: { requester: true, provider: true },
        });
        if (task) {
          const formatted = {
            ...task,
            onChainId: task.onChainId ? task.onChainId.toString() : null,
          } as Task;
          memoryTasks.set(id, formatted);
          return formatted;
        }
      } catch (err) {
        console.warn("Prisma findUnique failed, using memory fallback:", err);
      }
    }

    return cached || null;
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
    const normalizedRequester = data.requesterAddress.toLowerCase();

    const taskData: Task = {
      id,
      onChainId: null,
      title: data.title,
      description: data.description,
      category: data.category || "Testing",
      skills: data.skills || [],
      rewardWei: data.rewardWei,
      estimatedMinutes: data.estimatedMinutes || 15,
      status: "PENDING_CHAIN",
      requesterAddress: normalizedRequester,
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

    // Save in global memory immediately
    memoryTasks.set(id, taskData);

    if (isDbConfigured()) {
      try {
        await prisma.user.upsert({
          where: { address: normalizedRequester },
          update: {},
          create: {
            address: normalizedRequester,
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
            requesterAddress: normalizedRequester,
          },
        });

        const formatted = {
          ...created,
          onChainId: null,
        } as Task;

        memoryTasks.set(id, formatted);
        return formatted;
      } catch (err) {
        console.warn("Prisma create failed, continuing with memory store:", err);
      }
    }

    return taskData;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const existing = memoryTasks.get(id);
    const merged: Task = {
      ...(existing || ({} as Task)),
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    } as Task;

    memoryTasks.set(id, merged);

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

        const formatted = {
          ...updated,
          onChainId: updated.onChainId ? updated.onChainId.toString() : null,
        } as Task;

        memoryTasks.set(id, formatted);
        return formatted;
      } catch (err) {
        console.warn("Prisma update failed, updated in memory store:", err);
      }
    }

    return merged;
  },

  async getUser(address: string): Promise<User> {
    const normalized = address.toLowerCase();
    const cached = memoryUsers.get(normalized);

    if (isDbConfigured()) {
      try {
        const user = await prisma.user.findUnique({
          where: { address: normalized },
        });
        if (user) {
          memoryUsers.set(normalized, user as User);
          return user as User;
        }
      } catch (err) {
        console.warn("Prisma getUser failed, using memory store:", err);
      }
    }

    if (!cached) {
      const newUser: User = {
        address: normalized,
        displayName: null,
        skills: [],
        tasksCompleted: 0,
        tasksApproved: 0,
        isAvailable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryUsers.set(normalized, newUser);
      return newUser;
    }

    return cached;
  },

  async getAvailableUsers(): Promise<User[]> {
    if (isDbConfigured()) {
      try {
        const users = await prisma.user.findMany({
          where: { isAvailable: true },
          take: 12,
          orderBy: { tasksApproved: "desc" },
        });
        for (const u of users) {
          memoryUsers.set(u.address.toLowerCase(), u as User);
        }
        return users as User[];
      } catch (err) {
        console.warn("Prisma getAvailableUsers failed:", err);
      }
    }

    return Array.from(memoryUsers.values()).filter((u) => u.isAvailable);
  },

  async updateUser(address: string, updates: Partial<User>): Promise<User> {
    const normalized = address.toLowerCase();
    const current = await this.getUser(normalized);
    const merged: User = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    memoryUsers.set(normalized, merged);

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
        memoryUsers.set(normalized, updated as User);
        return updated as User;
      } catch (err) {
        console.warn("Prisma updateUser failed, updated in memory store:", err);
      }
    }

    return merged;
  },
};
