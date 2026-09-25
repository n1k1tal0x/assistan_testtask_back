import type { FastifyInstance } from "fastify";
import { addRequest, listRequests } from "../requests.store";
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

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

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

    if (to < from) {
      return reply.status(400).send({ error: "dateTo cannot be before dateFrom" });
    }

    if (!reason?.trim()) {
      return reply.status(400).send({ error: "reason is required" });
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
}
