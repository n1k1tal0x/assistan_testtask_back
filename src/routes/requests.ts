import type { FastifyInstance } from "fastify";
import { addRequest, approveRequest, listRequests, rejectRequest } from "../requests.store";
import { REQUEST_STATUSES, type RequestStatus } from "../types";

interface CreateRequestBody {
  fullName?: string;
  dateFrom?: string;
  dateTo?: string;
  reason?: string;
}

interface ListRequestsQuery {
  status?: string;
  page?: string;
  limit?: string;
}

interface RequestIdParams {
  id: string;
}

interface RejectRequestBody {
  reason?: string;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MIN_REASON_LENGTH = 20;
const LIST_PASSWORD_HEADER = "x-list-password";

const LIST_PASSWORD = process.env.LIST_PASSWORD;

if (!LIST_PASSWORD) {
  throw new Error("LIST_PASSWORD is not set");
}

function isRequestStatus(value: string): value is RequestStatus {
  return (REQUEST_STATUSES as readonly string[]).includes(value);
}

export default async function requestsRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateRequestBody }>("/requests", async (request, reply) => {
    const { fullName, dateFrom, dateTo, reason } = request.body ?? {};

    if (!fullName?.trim()) {
      return reply.status(400).send({ error: "fullName is required" });
    }

    if (!dateFrom || !dateTo) {
      return reply.status(400).send({ error: "dateFrom and dateTo are required" });
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return reply.status(400).send({ error: "dateFrom and dateTo must be valid dates" });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (from < today) {
      return reply.status(400).send({ error: "dateFrom cannot be before today" });
    }

    if (to < from) {
      return reply.status(400).send({ error: "dateTo cannot be before dateFrom" });
    }

    if (!reason?.trim()) {
      return reply.status(400).send({ error: "reason is required" });
    }

    if (reason.trim().length < MIN_REASON_LENGTH) {
      return reply
        .status(400)
        .send({ error: `reason must be at least ${MIN_REASON_LENGTH} characters long` });
    }

    const created = addRequest({
      fullName: fullName.trim(),
      dateFrom,
      dateTo,
      reason: reason.trim(),
    });

    return reply.status(201).send(created);
  });

  app.get<{ Querystring: ListRequestsQuery }>("/requests", async (request, reply) => {
    if (request.headers[LIST_PASSWORD_HEADER] !== LIST_PASSWORD) {
      return reply.status(401).send({ error: "invalid or missing password" });
    }

    const { status, page: pageRaw, limit: limitRaw } = request.query;

    if (status !== undefined && !isRequestStatus(status)) {
      return reply
        .status(400)
        .send({ error: `status must be one of: ${REQUEST_STATUSES.join(", ")}` });
    }

    const page = pageRaw !== undefined ? Number(pageRaw) : 1;
    if (!Number.isInteger(page) || page < 1) {
      return reply.status(400).send({ error: "page must be a positive integer" });
    }

    const limit = limitRaw !== undefined ? Number(limitRaw) : DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return reply
        .status(400)
        .send({ error: `limit must be an integer between 1 and ${MAX_LIMIT}` });
    }

    const filtered = listRequests().filter((r) => !status || r.status === status);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return reply.send({ items, total, page, limit });
  });

  app.patch<{ Params: RequestIdParams }>("/requests/:id/approve", async (request, reply) => {
    const result = approveRequest(request.params.id);

    if (result.type === "not_found") {
      return reply.status(404).send({ error: "request not found" });
    }

    if (result.type === "not_pending") {
      return reply.status(409).send({ error: "only pending requests can be approved" });
    }

    return reply.send(result.request);
  });

  app.patch<{ Params: RequestIdParams; Body: RejectRequestBody }>(
    "/requests/:id/reject",
    async (request, reply) => {
      const reason = request.body?.reason;

      if (!reason?.trim()) {
        return reply.status(400).send({ error: "reason is required" });
      }

      const result = rejectRequest(request.params.id, reason.trim());

      if (result.type === "not_found") {
        return reply.status(404).send({ error: "request not found" });
      }

      if (result.type === "not_pending") {
        return reply.status(409).send({ error: "only pending requests can be rejected" });
      }

      return reply.send(result.request);
    }
  );
}
