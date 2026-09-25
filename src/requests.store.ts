import { randomUUID } from "node:crypto";
import type { VacationRequest } from "./types";

const requests: VacationRequest[] = [];

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
  return request;
}

export function listRequests(): VacationRequest[] {
  return requests;
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
  return { type: "ok", request };
}
