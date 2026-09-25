import type { FastifyInstance } from "fastify";
import { addRequest } from "../requests.store";

interface CreateRequestBody {
  fullName?: string;
  dateFrom?: string;
  dateTo?: string;
  reason?: string;
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
}
