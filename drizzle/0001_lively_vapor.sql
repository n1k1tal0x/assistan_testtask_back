CREATE TYPE "public"."request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "request_statuses" (
	"request_id" uuid PRIMARY KEY NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "request_statuses" ADD CONSTRAINT "request_statuses_request_id_vacation_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."vacation_requests"("id") ON DELETE no action ON UPDATE no action;