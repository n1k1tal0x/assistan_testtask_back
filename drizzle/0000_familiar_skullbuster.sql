CREATE TABLE "vacation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"reason" text NOT NULL
);
