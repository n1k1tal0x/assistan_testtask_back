import { pgTable, uuid, text, date } from "drizzle-orm/pg-core";

export const vacationRequests = pgTable("vacation_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to").notNull(),
  reason: text("reason").notNull(),
});
