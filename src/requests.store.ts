import { randomUUID } from "node:crypto";
import type { VacationRequest } from "./types";

const requests: VacationRequest[] = [];

export function addRequest(data: Omit<VacationRequest, "id">): VacationRequest {
  const request: VacationRequest = { id: randomUUID(), ...data };
  requests.push(request);
  return request;
}
