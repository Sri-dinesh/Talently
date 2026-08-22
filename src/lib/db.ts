// src/lib/db.ts
import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
import type { Task, User, TaskStatus } from "@/types/task";
import type { SwarmTask, SwarmSubmission, SwarmStatus, SwarmSubmissionStatus } from "@/types/swarm";
import type { FloorGame } from "@/types/floor";

const DATA_DIR = path.join(process.cwd(), ".data");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SWARM_TASKS_FILE = path.join(DATA_DIR, "swarm_tasks.json");
const SWARM_SUBMISSIONS_FILE = path.join(DATA_DIR, "swarm_submissions.json");

const FLOOR_GAMES_FILE = path.join(DATA_DIR, "floor_games.json");

// Global in-memory store shared across all Next.js server route closures
const globalForMemory = globalThis as unknown as {
  memoryTasks: Map<string, Task> | undefined;
  memoryUsers: Map<string, User> | undefined;
  memorySwarmTasks: Map<string, SwarmTask> | undefined;
  memorySwarmSubmissions: Map<string, SwarmSubmission> | undefined;
  memoryFloorGames: Map<string, FloorGame> | undefined;
  dbDisabled: boolean | undefined;
};

const memoryTasks: Map<string, Task> =
  globalForMemory.memoryTasks ?? new Map<string, Task>();
const memoryUsers: Map<string, User> =
  globalForMemory.memoryUsers ?? new Map<string, User>();
const memorySwarmTasks: Map<string, SwarmTask> =
  globalForMemory.memorySwarmTasks ?? new Map<string, SwarmTask>();
const memorySwarmSubmissions: Map<string, SwarmSubmission> =
  globalForMemory.memorySwarmSubmissions ?? new Map<string, SwarmSubmission>();
const memoryFloorGames: Map<string, FloorGame> =
  globalForMemory.memoryFloorGames ?? new Map<string, FloorGame>();

globalForMemory.memoryTasks = memoryTasks;
globalForMemory.memoryUsers = memoryUsers;
globalForMemory.memorySwarmTasks = memorySwarmTasks;
globalForMemory.memorySwarmSubmissions = memorySwarmSubmissions;
globalForMemory.memoryFloorGames = memoryFloorGames;

// Hydrate from persistent disk store on startup
function loadFromDisk(): void {
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const raw = fs.readFileSync(TASKS_FILE, "utf-8");
      const tasks: Task[] = JSON.parse(raw);
      memoryTasks.clear();
      for (const t of tasks) {
        memoryTasks.set(t.id, t);
      }
    }
  } catch {
    // ignore
  }

  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const users: User[] = JSON.parse(raw);
      memoryUsers.clear();
      for (const u of users) {
        const addr = u.address.toLowerCase();
        memoryUsers.set(addr, u);
      }
    }
  } catch {
    // ignore
  }

  try {
    if (fs.existsSync(SWARM_TASKS_FILE)) {
      const raw = fs.readFileSync(SWARM_TASKS_FILE, "utf-8");
      const swarmTasks: SwarmTask[] = JSON.parse(raw);
      memorySwarmTasks.clear();
      for (const st of swarmTasks) {
        memorySwarmTasks.set(st.id, st);
      }
    }
  } catch {
    // ignore
  }

  try {
    if (fs.existsSync(SWARM_SUBMISSIONS_FILE)) {
      const raw = fs.readFileSync(SWARM_SUBMISSIONS_FILE, "utf-8");
      const subs: SwarmSubmission[] = JSON.parse(raw);
      memorySwarmSubmissions.clear();
      for (const s of subs) {
        memorySwarmSubmissions.set(s.id, s);
      }
    }
  } catch {
    // ignore
  }

  try {
    if (fs.existsSync(FLOOR_GAMES_FILE)) {
      const raw = fs.readFileSync(FLOOR_GAMES_FILE, "utf-8");
      const games: FloorGame[] = JSON.parse(raw);
      memoryFloorGames.clear();
      for (const g of games) {
        memoryFloorGames.set(g.id, g);
      }
    }
  } catch {
    // ignore
  }
}

// Persist memory store to disk
function saveToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      TASKS_FILE,
      JSON.stringify(Array.from(memoryTasks.values()), null, 2),
      "utf-8"
    );
    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify(Array.from(memoryUsers.values()), null, 2),
      "utf-8"
    );
    fs.writeFileSync(
      SWARM_TASKS_FILE,
      JSON.stringify(Array.from(memorySwarmTasks.values()), null, 2),
      "utf-8"
    );
    fs.writeFileSync(
      SWARM_SUBMISSIONS_FILE,
      JSON.stringify(Array.from(memorySwarmSubmissions.values()), null, 2),
      "utf-8"
    );
    fs.writeFileSync(
      FLOOR_GAMES_FILE,
      JSON.stringify(Array.from(memoryFloorGames.values()), null, 2),
      "utf-8"
    );
  } catch {
    // ignore
  }
}

// Initial hydration
loadFromDisk();

export function isDbConfigured(): boolean {
  if (globalForMemory.dbDisabled) return false;
  if (process.env.USE_PRISMA !== "true") return false;
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
  }
}

async function withTimeout<T>(promise: Promise<T>, ms = 1000): Promise<T> {
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
  requirements?: string[];
  rewardWei: string;
  estimatedMinutes: number | null;
  status: string;
  requesterAddress: string;
  providerAddress: string | null;
  resultText: string | null;
  resultSeverity: string | null;
  resultAttachmentUrl: string | null;
  verificationScorecard?: any;
  createTxHash: string | null;
  acceptTxHash: string | null;
  submitTxHash: string | null;
  approveTxHash: string | null;
  acceptedAt?: string | null;
  submittedAt?: string | null;
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
    requirements: t.requirements || [],
    rewardWei: t.rewardWei,
    estimatedMinutes: t.estimatedMinutes,
    status: t.status as TaskStatus,
    requesterAddress: t.requesterAddress,
    providerAddress: t.providerAddress,
    resultText: t.resultText,
    resultSeverity: (t.resultSeverity as "Low" | "Medium" | "High") || null,
    resultAttachmentUrl: t.resultAttachmentUrl,
    verificationScorecard: t.verificationScorecard || null,
    createTxHash: t.createTxHash,
    acceptTxHash: t.acceptTxHash,
    submitTxHash: t.submitTxHash,
    approveTxHash: t.approveTxHash,
    acceptedAt: t.acceptedAt || null,
    submittedAt: t.submittedAt || null,
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
    loadFromDisk();

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
        saveToDisk();
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
    loadFromDisk();
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
          saveToDisk();
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
    requirements?: string[];
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
      requirements: data.requirements || [],
      rewardWei: data.rewardWei,
      estimatedMinutes: data.estimatedMinutes || null,
      status: "PENDING_CHAIN",
      requesterAddress: normalizedRequester,
      providerAddress: null,
      resultText: null,
      resultSeverity: null,
      resultAttachmentUrl: null,
      verificationScorecard: null,
      createTxHash: null,
      acceptTxHash: null,
      submitTxHash: null,
      approveTxHash: null,
      acceptedAt: null,
      submittedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryTasks.set(id, taskData);
    saveToDisk();

    if (isDbConfigured()) {
      try {
        await withTimeout(
          prisma.user.upsert({
            where: { address: normalizedRequester },
            update: {},
            create: { address: normalizedRequester },
          })
        );

        const created = await withTimeout(
          prisma.task.create({
            data: {
              id,
              title: data.title,
              description: data.description,
              category: data.category,
              skills: data.skills || [],
              rewardWei: data.rewardWei,
              estimatedMinutes: data.estimatedMinutes,
              status: "PENDING_CHAIN",
              requesterAddress: normalizedRequester,
            },
          })
        );
        const formatted = formatTask(created);
        memoryTasks.set(id, formatted);
        saveToDisk();
        return formatted;
      } catch (err) {
        handlePrismaError(err);
      }
    }

    return taskData;
  },

  async updateTask(
    id: string,
    data: Partial<{
      onChainId: string | number | bigint | null;
      title: string;
      description: string;
      category: string | null;
      skills: string[];
      requirements: string[];
      rewardWei: string;
      estimatedMinutes: number | null;
      status: TaskStatus;
      providerAddress: string | null;
      resultText: string | null;
      resultSeverity: "Low" | "Medium" | "High" | string | null;
      resultAttachmentUrl: string | null;
      verificationScorecard: any;
      createTxHash: string | null;
      acceptTxHash: string | null;
      submitTxHash: string | null;
      approveTxHash: string | null;
      acceptedAt: string | null;
      submittedAt: string | null;
    }>
  ): Promise<Task> {
    loadFromDisk();
    const existing = memoryTasks.get(id);

    const updatedTask: Task = {
      ...(existing || {
        id,
        onChainId: null,
        title: "",
        description: "",
        category: "Testing",
        skills: [],
        requirements: [],
        rewardWei: "0",
        estimatedMinutes: null,
        status: "OPEN",
        requesterAddress: "",
        providerAddress: null,
        resultText: null,
        resultSeverity: null,
        resultAttachmentUrl: null,
        verificationScorecard: null,
        createTxHash: null,
        acceptTxHash: null,
        submitTxHash: null,
        approveTxHash: null,
        acceptedAt: null,
        submittedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      ...(data.onChainId !== undefined
        ? { onChainId: data.onChainId ? data.onChainId.toString() : null }
        : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.providerAddress !== undefined
        ? { providerAddress: data.providerAddress ? data.providerAddress.toLowerCase() : null }
        : {}),
      ...(data.requirements !== undefined ? { requirements: data.requirements } : {}),
      ...(data.resultText !== undefined ? { resultText: data.resultText } : {}),
      ...(data.resultSeverity !== undefined ? { resultSeverity: data.resultSeverity } : {}),
      ...(data.resultAttachmentUrl !== undefined
        ? { resultAttachmentUrl: data.resultAttachmentUrl }
        : {}),
      ...(data.verificationScorecard !== undefined
        ? { verificationScorecard: data.verificationScorecard }
        : {}),
      ...(data.createTxHash !== undefined ? { createTxHash: data.createTxHash } : {}),
      ...(data.acceptTxHash !== undefined ? { acceptTxHash: data.acceptTxHash } : {}),
      ...(data.submitTxHash !== undefined ? { submitTxHash: data.submitTxHash } : {}),
      ...(data.approveTxHash !== undefined ? { approveTxHash: data.approveTxHash } : {}),
      ...(data.acceptedAt !== undefined ? { acceptedAt: data.acceptedAt } : {}),
      ...(data.submittedAt !== undefined ? { submittedAt: data.submittedAt } : {}),
      updatedAt: new Date().toISOString(),
    };

    memoryTasks.set(id, updatedTask);
    saveToDisk();

    if (isDbConfigured()) {
      try {
        const updateData: Record<string, unknown> = { ...data };
        if (data.onChainId !== undefined) {
          updateData.onChainId = data.onChainId ? BigInt(data.onChainId.toString()) : null;
        }
        if (data.providerAddress) {
          updateData.providerAddress = data.providerAddress.toLowerCase();
          await withTimeout(
            prisma.user.upsert({
              where: { address: data.providerAddress.toLowerCase() },
              update: {},
              create: { address: data.providerAddress.toLowerCase() },
            })
          );
        }

        const raw = await withTimeout(
          prisma.task.update({
            where: { id },
            data: updateData,
          })
        );
        const formatted = formatTask(raw);
        memoryTasks.set(id, formatted);
        saveToDisk();
        return formatted;
      } catch (err) {
        handlePrismaError(err);
      }
    }

    return updatedTask;
  },

  async getUser(address: string): Promise<User | null> {
    loadFromDisk();
    const normalized = address.toLowerCase();
    const cached = memoryUsers.get(normalized);
    if (cached) return cached;

    if (isDbConfigured()) {
      try {
        const raw = await withTimeout(
          prisma.user.findUnique({
            where: { address: normalized },
            include: {
              tasksRequested: { orderBy: { createdAt: "desc" } },
              tasksProvided: { orderBy: { createdAt: "desc" } },
            },
          })
        );
        if (raw) {
          const formatted = formatUser(raw);
          memoryUsers.set(normalized, formatted);
          saveToDisk();
          return formatted;
        }
      } catch (err) {
        handlePrismaError(err);
      }
    }

    // Default clean user profile (unpersisted until saved)
    return {
      address: normalized,
      displayName: null,
      skills: [],
      tasksCompleted: 0,
      tasksApproved: 0,
      isAvailable: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateUser(
    address: string,
    data: {
      displayName?: string;
      skills?: string[];
      isAvailable?: boolean;
      tasksCompleted?: number;
      tasksApproved?: number;
    }
  ): Promise<User> {
    loadFromDisk();
    const normalized = address.toLowerCase();
    const existing = memoryUsers.get(normalized) || {
      address: normalized,
      displayName: null,
      skills: [],
      tasksCompleted: 0,
      tasksApproved: 0,
      isAvailable: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated: User = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    memoryUsers.set(normalized, updated);
    saveToDisk();

    if (isDbConfigured()) {
      try {
        const raw = await withTimeout(
          prisma.user.upsert({
            where: { address: normalized },
            update: data,
            create: {
              address: normalized,
              ...data,
            },
          })
        );
        const formatted = formatUser(raw);
        memoryUsers.set(normalized, formatted);
        saveToDisk();
        return formatted;
      } catch (err) {
        handlePrismaError(err);
      }
    }

    return updated;
  },

  async getAvailableUsers(): Promise<User[]> {
    loadFromDisk();
    if (isDbConfigured()) {
      try {
        const raw = await withTimeout(
          prisma.user.findMany({
            where: { isAvailable: true },
            orderBy: { tasksApproved: "desc" },
            take: 12,
          })
        );
        const result = raw.map((u) => formatUser(u));
        for (const u of result) {
          memoryUsers.set(u.address.toLowerCase(), u);
        }
        saveToDisk();
        return result;
      } catch (err) {
        handlePrismaError(err);
      }
    }

    const users = Array.from(memoryUsers.values()).filter((u) => u.isAvailable);
    return users.sort((a, b) => b.tasksApproved - a.tasksApproved);
  },

  // =========================================================================
  // SWARM TASK CRUD
  // =========================================================================

  async createSwarmTask(data: {
    title: string;
    description: string;
    category?: string;
    skills?: string[];
    requirements?: string[];
    rewardWeiPerWorker: string;
    estimatedMinutes?: number | null;
    maxWorkers: number;
    requesterAddress: string;
  }): Promise<SwarmTask> {
    loadFromDisk();
    const id = `swarm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const swarmTask: SwarmTask = {
      id,
      title: data.title,
      description: data.description,
      category: data.category || "Testing",
      skills: data.skills || [],
      requirements: data.requirements || [],
      rewardWeiPerWorker: data.rewardWeiPerWorker,
      estimatedMinutes: data.estimatedMinutes || null,
      maxWorkers: data.maxWorkers,
      status: "OPEN",
      requesterAddress: data.requesterAddress.toLowerCase(),
      clusterReport: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memorySwarmTasks.set(id, swarmTask);
    saveToDisk();
    return swarmTask;
  },

  async getSwarmTask(id: string): Promise<SwarmTask | null> {
    loadFromDisk();
    return memorySwarmTasks.get(id) || null;
  },

  async getSwarmTasks(filters?: {
    status?: SwarmStatus;
    requesterAddress?: string;
    limit?: number;
  }): Promise<SwarmTask[]> {
    loadFromDisk();
    let tasks = Array.from(memorySwarmTasks.values());
    if (filters?.status) tasks = tasks.filter((t) => t.status === filters.status);
    if (filters?.requesterAddress) {
      tasks = tasks.filter(
        (t) => t.requesterAddress === filters.requesterAddress!.toLowerCase()
      );
    }
    tasks.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return tasks.slice(0, filters?.limit || 50);
  },

  async updateSwarmTask(
    id: string,
    data: Partial<{
      status: SwarmStatus;
      clusterReport: SwarmTask["clusterReport"];
      refundedWei: string;
    }>
  ): Promise<SwarmTask> {
    loadFromDisk();
    const existing = memorySwarmTasks.get(id);
    if (!existing) throw new Error(`SwarmTask ${id} not found`);
    const updated: SwarmTask = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    memorySwarmTasks.set(id, updated);
    saveToDisk();
    return updated;
  },

  // =========================================================================
  // SWARM SUBMISSION CRUD
  // =========================================================================

  async createSwarmSubmission(data: {
    swarmId: string;
    workerAddress: string;
  }): Promise<SwarmSubmission> {
    loadFromDisk();
    const id = `ssub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const submission: SwarmSubmission = {
      id,
      swarmId: data.swarmId,
      workerAddress: data.workerAddress.toLowerCase(),
      status: "EXECUTING",
      resultText: null,
      resultSeverity: null,
      resultAttachmentUrl: null,
      verificationScorecard: null,
      acceptedAt: new Date().toISOString(),
      submittedAt: null,
      payoutTxHash: null,
      refundTxHash: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memorySwarmSubmissions.set(id, submission);
    saveToDisk();
    return submission;
  },

  async getSwarmSubmissions(swarmId: string): Promise<SwarmSubmission[]> {
    loadFromDisk();
    return Array.from(memorySwarmSubmissions.values()).filter(
      (s) => s.swarmId === swarmId
    );
  },

  async getSwarmSubmissionByWorker(
    swarmId: string,
    workerAddress: string
  ): Promise<SwarmSubmission | null> {
    loadFromDisk();
    const normalized = workerAddress.toLowerCase();
    return (
      Array.from(memorySwarmSubmissions.values()).find(
        (s) => s.swarmId === swarmId && s.workerAddress === normalized
      ) || null
    );
  },

  async updateSwarmSubmission(
    id: string,
    data: Partial<{
      status: SwarmSubmissionStatus;
      resultText: string | null;
      resultSeverity: string | null;
      resultAttachmentUrl: string | null;
      verificationScorecard: SwarmSubmission["verificationScorecard"];
      submittedAt: string | null;
      payoutTxHash: string | null;
      refundTxHash: string | null;
    }>
  ): Promise<SwarmSubmission> {
    loadFromDisk();
    const existing = memorySwarmSubmissions.get(id);
    if (!existing) throw new Error(`SwarmSubmission ${id} not found`);
    const updated: SwarmSubmission = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    memorySwarmSubmissions.set(id, updated);
    saveToDisk();
    return updated;
  },

  // ---------------- Floor Is Lying Game Methods ----------------
  async createFloorGame(game: FloorGame): Promise<FloorGame> {
    loadFromDisk();
    memoryFloorGames.set(game.id, game);
    saveToDisk();
    return game;
  },

  async getFloorGame(id: string): Promise<FloorGame | null> {
    loadFromDisk();
    return memoryFloorGames.get(id) || null;
  },

  async listFloorGames(): Promise<FloorGame[]> {
    loadFromDisk();
    return Array.from(memoryFloorGames.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async updateFloorGame(id: string, data: Partial<FloorGame>): Promise<FloorGame> {
    loadFromDisk();
    const existing = memoryFloorGames.get(id);
    if (!existing) throw new Error(`FloorGame ${id} not found`);
    const updated: FloorGame = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    memoryFloorGames.set(id, updated);
    saveToDisk();
    return updated;
  },

  async deleteFloorGame(id: string): Promise<boolean> {
    loadFromDisk();
    const deleted = memoryFloorGames.delete(id);
    if (deleted) saveToDisk();
    return deleted;
  },
};

