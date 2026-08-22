// src/types/contract-events.ts
import type { Address } from "viem";

export interface TaskCreatedEvent {
  taskId: bigint;
  requester: Address;
  reward: bigint;
  createdAt: bigint;
}

export interface TaskAcceptedEvent {
  taskId: bigint;
  provider: Address;
}

export interface ResultSubmittedEvent {
  taskId: bigint;
  provider: Address;
}

export interface TaskApprovedEvent {
  taskId: bigint;
  provider: Address;
  reward: bigint;
}

export interface TaskCancelledEvent {
  taskId: bigint;
  requester: Address;
  refund: bigint;
}
