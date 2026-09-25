import { randomUUID } from "node:crypto";
import type { VacationRequest } from "./types";

const requests: VacationRequest[] = [];

export function addRequest(
  data: Omit<VacationRequest, "id" | "status">
): VacationRequest {
  const request: VacationRequest = { id: randomUUID(), status: "pending", ...data };
  requests.push(request);
  return request;
}

export function listRequests(): VacationRequest[] {
  return requests;
}
