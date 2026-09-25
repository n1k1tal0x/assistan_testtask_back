import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { VacationRequest } from "./types";

const DATA_FILE = process.env.DATA_FILE ?? "./data/requests.json";

function loadRequests(): VacationRequest[] {
  if (!existsSync(DATA_FILE)) {
    return [];
  }

  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as VacationRequest[];
  } catch {
    return [];
  }
}

function persist(): void {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2));
}

const requests: VacationRequest[] = loadRequests();

export function addRequest(
  data: Omit<VacationRequest, "id" | "status" | "rejectionReason">
): VacationRequest {
  const request: VacationRequest = {
    id: randomUUID(),
    status: "pending",
    rejectionReason: null,
    ...data,
  };
  requests.push(request);
  persist();
  return request;
}

export function listRequests(): VacationRequest[] {
  return requests;
}

/** Только для тестов: очищает хранилище, чтобы тесты не влияли друг на друга. */
export function resetRequestsStore(): void {
  requests.length = 0;
  persist();
}

export type UpdateStatusResult =
  | { type: "not_found" }
  | { type: "not_pending" }
  | { type: "ok"; request: VacationRequest };

export function approveRequest(id: string): UpdateStatusResult {
  const request = requests.find((r) => r.id === id);

  if (!request) {
    return { type: "not_found" };
  }

  if (request.status !== "pending") {
    return { type: "not_pending" };
  }

  request.status = "approved";
  persist();
  return { type: "ok", request };
}

export function rejectRequest(id: string, rejectionReason: string): UpdateStatusResult {
  const request = requests.find((r) => r.id === id);

  if (!request) {
    return { type: "not_found" };
  }

  if (request.status !== "pending") {
    return { type: "not_pending" };
  }

  request.status = "rejected";
  request.rejectionReason = rejectionReason;
  persist();
  return { type: "ok", request };
}
