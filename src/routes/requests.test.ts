import "dotenv/config";
import { before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app";
import { resetRequestsStore } from "../requests.store";

const LIST_PASSWORD = process.env.LIST_PASSWORD!;

const VALID_REASON = "Ежегодный оплачиваемый отпуск";

function futureDate(daysFromNow: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

let app: FastifyInstance;

before(() => {
  app = buildApp({ logger: false });
});

beforeEach(() => {
  resetRequestsStore();
});

describe("POST /requests", () => {
  it("creates a request with valid data", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/requests",
      payload: {
        fullName: "Иванов Иван",
        dateFrom: futureDate(5),
        dateTo: futureDate(10),
        reason: VALID_REASON,
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.status, "pending");
    assert.equal(body.rejectionReason, null);
    assert.equal(typeof body.id, "string");
  });

  it("rejects a reason shorter than 20 characters", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/requests",
      payload: {
        fullName: "Иванов Иван",
        dateFrom: futureDate(5),
        dateTo: futureDate(10),
        reason: "слишком коротко",
      },
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.json().error, /20 characters/);
  });

  it("rejects a dateFrom in the past", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/requests",
      payload: {
        fullName: "Иванов Иван",
        dateFrom: "2000-01-01",
        dateTo: futureDate(5),
        reason: VALID_REASON,
      },
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.json().error, /before today/);
  });

  it("rejects dateTo before dateFrom", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/requests",
      payload: {
        fullName: "Иванов Иван",
        dateFrom: futureDate(10),
        dateTo: futureDate(5),
        reason: VALID_REASON,
      },
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.json().error, /before dateFrom/);
  });
});

describe("GET /requests", () => {
  it("requires the list password", async () => {
    const response = await app.inject({ method: "GET", url: "/requests" });
    assert.equal(response.statusCode, 401);
  });

  it("rejects an incorrect password", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/requests",
      headers: { "x-list-password": "wrong-password" },
    });
    assert.equal(response.statusCode, 401);
  });

  it("returns created requests with the correct password", async () => {
    await app.inject({
      method: "POST",
      url: "/requests",
      payload: {
        fullName: "Петров Пётр",
        dateFrom: futureDate(1),
        dateTo: futureDate(2),
        reason: VALID_REASON,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/requests",
      headers: { "x-list-password": LIST_PASSWORD },
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.total, 1);
    assert.equal(body.items[0].fullName, "Петров Пётр");
  });

  it("filters by status", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/requests?status=approved",
      headers: { "x-list-password": LIST_PASSWORD },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().total, 0);
  });
});

describe("PATCH /requests/:id/approve and /reject", () => {
  async function createPendingRequest(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/requests",
      payload: {
        fullName: "Сидоров Сидор",
        dateFrom: futureDate(1),
        dateTo: futureDate(2),
        reason: VALID_REASON,
      },
    });
    return response.json().id as string;
  }

  it("approves a pending request", async () => {
    const id = await createPendingRequest();

    const response = await app.inject({ method: "PATCH", url: `/requests/${id}/approve` });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().status, "approved");
  });

  it("refuses to approve a request twice", async () => {
    const id = await createPendingRequest();
    await app.inject({ method: "PATCH", url: `/requests/${id}/approve` });

    const response = await app.inject({ method: "PATCH", url: `/requests/${id}/approve` });

    assert.equal(response.statusCode, 409);
  });

  it("returns 404 for an unknown id", async () => {
    const response = await app.inject({ method: "PATCH", url: "/requests/does-not-exist/approve" });
    assert.equal(response.statusCode, 404);
  });

  it("requires a reason to reject", async () => {
    const id = await createPendingRequest();

    const response = await app.inject({
      method: "PATCH",
      url: `/requests/${id}/reject`,
      payload: {},
    });

    assert.equal(response.statusCode, 400);
  });

  it("rejects a request with a reason, visible afterwards", async () => {
    const id = await createPendingRequest();

    const rejectResponse = await app.inject({
      method: "PATCH",
      url: `/requests/${id}/reject`,
      payload: { reason: "Нет замены на этот период" },
    });

    assert.equal(rejectResponse.statusCode, 200);
    assert.equal(rejectResponse.json().status, "rejected");
    assert.equal(rejectResponse.json().rejectionReason, "Нет замены на этот период");
  });
});
