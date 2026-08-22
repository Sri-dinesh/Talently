// src/lib/db.ts
import { prisma } from "./prisma";
import type { Task, User, TaskStatus } from "@/types/task";

// Global in-memory store shared across all Next.js server route closures
const globalForMemory = globalThis as unknown as {
  memoryTasks: Map<string, Task> | undefined;
  memoryUsers: Map<string, User> | undefined;
  dbDisabled: boolean | undefined;
};

const memoryTasks: Map<string, Task> =
  globalForMemory.memoryTasks ?? new Map<string, Task>();
const memoryUsers: Map<string, User> =
  globalForMemory.memoryUsers ?? new Map<string, User>();

globalForMemory.memoryTasks = memoryTasks;
globalForMemory.memoryUsers = memoryUsers;

export function isDbConfigured(): boolean {
  if (globalForMemory.dbDisabled) return false;
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
      (url.startsWith("postgresql://") || url.startsWith("postgres://")) &&
      !url.includes("[YOUR-PASSWORD]")
  );
}

function handlePrismaError(err: unknown): void {
  const errMsg = err instanceof Error ? err.message : String(err);
  if (
    errMsg.includes("Can't reach database server") ||
    errMsg.includes("PrismaClientInitializationError") ||
    errMsg.includes("DB timeout") ||
    errMsg.includes("ETIMEDOUT") ||
    errMsg.includes("ECONNREFUSED")
  ) {
    globalForMemory.dbDisabled = true;
    console.warn(
      "[Human API DB] Database unreachable or timed out. Operating on high-speed global in-memory store."
    );
  }
}

async function withTimeout<T>(promise: Promise<T>, ms = 1500): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("DB timeout")), ms);
  });

  return Promise.race([
    promise.then((res) => {
      if (timeoutId) clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
}

function formatTask(t: {
  id: string;
  onChainId: bigint | string | null;
  title: string;
  description: string;
  category: string | null;
  skills: string[];
  rewardWei: string;
  estimatedMinutes: number | null;
  status: string;
  requesterAddress: string;
  providerAddress: string | null;
  resultText: string | null;
  resultSeverity: string | null;
  resultAttachmentUrl: string | null;
  createTxHash: string | null;
  acceptTxHash: string | null;
  submitTxHash: string | null;
  approveTxHash: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}): Task {
  return {
    id: t.id,
    onChainId: t.onChainId ? t.onChainId.toString() : null,
    title: t.title,
    description: t.description,
    category: t.category || "Testing",
    skills: t.skills || [],
    rewardWei: t.rewardWei,
    estimatedMinutes: t.estimatedMinutes,
    status: t.status as TaskStatus,
    requesterAddress: t.requesterAddress,
    providerAddress: t.providerAddress,
    resultText: t.resultText,
    resultSeverity: (t.resultSeverity as "Low" | "Medium" | "High") || null,
    resultAttachmentUrl: t.resultAttachmentUrl,
    createTxHash: t.createTxHash,
    acceptTxHash: t.acceptTxHash,
    submitTxHash: t.submitTxHash,
    approveTxHash: t.approveTxHash,
    createdAt:
      t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
    updatedAt:
      t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt),
  };
}

function formatUser(u: {
  address: string;
  displayName: string | null;
  skills: string[];
  tasksCompleted: number;
  tasksApproved: number;
  isAvailable: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}): User {
  return {
    address: u.address,
    displayName: u.displayName,
    skills: u.skills,
    tasksCompleted: u.tasksCompleted,
    tasksApproved: u.tasksApproved,
    isAvailable: u.isAvailable,
    createdAt:
      u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
    updatedAt:
      u.updatedAt instanceof Date ? u.updatedAt.toISOString() : String(u.updatedAt),
  };
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
        const whereClause: Record<string, unknown> = {};
        if (filters?.status) whereClause.status = filters.status;
        if (filters?.category && filters.category !== "All")
          whereClause.category = filters.category;
        if (filters?.skill) whereClause.skills = { has: filters.skill };
        if (filters?.requesterAddress)
          whereClause.requesterAddress = filters.requesterAddress.toLowerCase();
        if (filters?.providerAddress)
          whereClause.providerAddress = filters.providerAddress.toLowerCase();

        const dbTasks = await withTimeout(
          prisma.task.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: filters?.limit || 50,
            include: {
              requester: true,
              provider: true,
            },
          })
        );

        const result: Task[] = [];
        for (const raw of dbTasks) {
          const formatted = formatTask(raw);
          memoryTasks.set(formatted.id, formatted);
          result.push(formatted);
        }

        return result;
      } catch (err) {
        handlePrismaError(err);
      }
    }

    // Instant in-memory search
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

    tasks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return tasks.slice(0, filters?.limit || 50);
  },

  async getTask(id: string): Promise<Task | null> {
    const cached = memoryTasks.get(id);
    if (cached) return cached;

    if (isDbConfigured()) {
      try {
        const raw = await withTimeout(
          prisma.task.findUnique({
            where: { id },
            include: { requester: true, provider: true },
          })
        );
        if (raw) {
          const formatted = formatTask(raw);
          memoryTasks.set(id, formatted);
          return formatted;
        }
      } catch (err) {
        handlePrismaError(err);
      }
    }

    return null;
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

    memoryTasks.set(id, taskData);

    if (isDbConfigured()) {
      withTimeout(
        prisma.user
          .upsert({
            where: { address: normalizedRequester },
            update: {},
            create: { address: normalizedRequester, skills: [] },
          })
          .then(() =>
            prisma.task.create({
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
            })
          )
      ).catch((err) => handlePrismaError(err));
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
      const prismaUpdates: Record<string, unknown> = { ...updates };
      if (updates.onChainId !== undefined) {
        prismaUpdates.onChainId = updates.onChainId
          ? BigInt(updates.onChainId.toString())
          : null;
      }

      withTimeout(
        prisma.task.update({
          where: { id },
          data: prismaUpdates,
        })
      ).catch((err) => handlePrismaError(err));
    }

    return merged;
  },

  async getUser(address: string): Promise<User> {
    const normalized = address.toLowerCase();
    const cached = memoryUsers.get(normalized);
    if (cached) return cached;

    if (isDbConfigured()) {
      try {
        const raw = await withTimeout(
          prisma.user.findUnique({
            where: { address: normalized },
          })
        );
        if (raw) {
          const formatted = formatUser(raw);
          memoryUsers.set(normalized, formatted);
          return formatted;
        }
      } catch (err) {
        handlePrismaError(err);
      }
    }

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
  },

  async getAvailableUsers(): Promise<User[]> {
    if (isDbConfigured()) {
      try {
        const rawUsers = await withTimeout(
          prisma.user.findMany({
            where: { isAvailable: true },
            take: 12,
            orderBy: { tasksApproved: "desc" },
          })
        );
        const result: User[] = [];
        for (const raw of rawUsers) {
          const formatted = formatUser(raw);
          memoryUsers.set(formatted.address.toLowerCase(), formatted);
          result.push(formatted);
        }
        return result;
      } catch (err) {
        handlePrismaError(err);
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
      withTimeout(
        prisma.user.upsert({
          where: { address: normalized },
          update: updates,
          create: {
            address: normalized,
            displayName: updates.displayName || null,
            skills: updates.skills || [],
            isAvailable: updates.isAvailable || false,
          },
        })
      ).catch((err) => handlePrismaError(err));
    }

    return merged;
  },
};
