// src/lib/validation.ts
import { z } from "zod";

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be under 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be under 1000 characters"),
  category: z
    .enum(["Technical", "Design", "Knowledge", "Testing", "Social", "Local"])
    .optional(),
  skills: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  rewardWei: z.string().refine((val) => {
    try {
      const b = BigInt(val);
      return b > 0n;
    } catch {
      return false;
    }
  }, "Reward must be a positive wei amount"),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  requesterAddress: z
    .string()
    .regex(ethAddressRegex, "Invalid Ethereum/Monad wallet address")
    .transform((val) => val.toLowerCase()),
});

export const patchTaskSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  expectedTransition: z.enum(["create", "accept", "submit", "approve", "cancel"]),
});

export const acceptTaskSchema = z.object({
  providerAddress: z
    .string()
    .regex(ethAddressRegex, "Invalid Ethereum/Monad wallet address")
    .transform((val) => val.toLowerCase()),
});

export const submitResultSchema = z.object({
  resultText: z.string().min(1, "Result text is required"),
  resultSeverity: z.enum(["Low", "Medium", "High"]).optional().nullable(),
  resultAttachmentUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const patchUserSchema = z.object({
  displayName: z.string().max(50).optional().nullable(),
  skills: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
});

export const classifyTaskSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

// =========================================================================
// SWARM SCHEMAS
// =========================================================================

export const createSwarmTaskSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be under 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be under 1000 characters"),
  category: z
    .enum(["Technical", "Design", "Knowledge", "Testing", "Social", "Local"])
    .optional(),
  skills: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  rewardWeiPerWorker: z.string().refine((val) => {
    try {
      const b = BigInt(val);
      return b > 0n;
    } catch {
      return false;
    }
  }, "Reward per worker must be a positive wei amount"),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  maxWorkers: z
    .number()
    .int()
    .min(2, "Swarm requires at least 2 workers")
    .max(20, "Maximum swarm size is 20 workers"),
  requesterAddress: z
    .string()
    .regex(ethAddressRegex, "Invalid Ethereum/Monad wallet address")
    .transform((val) => val.toLowerCase()),
});

export const joinSwarmSchema = z.object({
  workerAddress: z
    .string()
    .regex(ethAddressRegex, "Invalid Ethereum/Monad wallet address")
    .transform((val) => val.toLowerCase()),
});

export const submitSwarmResultSchema = z.object({
  workerAddress: z
    .string()
    .regex(ethAddressRegex, "Invalid Ethereum/Monad wallet address")
    .transform((val) => val.toLowerCase()),
  resultText: z.string().min(1, "Result text is required"),
  resultSeverity: z.enum(["Low", "Medium", "High"]).optional().nullable(),
  resultAttachmentUrl: z.string().url().optional().nullable().or(z.literal("")),
});

