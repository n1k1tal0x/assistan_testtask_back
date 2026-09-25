import { pgTable, pgEnum, uuid, text, date } from "drizzle-orm/pg-core";

export const vacationRequests = pgTable("vacation_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to").notNull(),
  reason: text("reason").notNull(),
});

export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const requestStatuses = pgTable("request_statuses", {
  requestId: uuid("request_id")
    .primaryKey()
    .references(() => vacationRequests.id),
  status: requestStatusEnum("status").notNull().default("pending"),
});
