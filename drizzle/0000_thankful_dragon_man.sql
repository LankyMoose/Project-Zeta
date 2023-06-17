CREATE TABLE IF NOT EXISTS "poll_option" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"text" varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS "poll" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"text" varchar(255) NOT NULL,
	"started_at" date DEFAULT now() NOT NULL,
	"ended_at" date,
	"disabled" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"created_at" date DEFAULT now(),
	"disabled" boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS "poll_id_idx" ON "poll_option" ("poll_id");
CREATE INDEX IF NOT EXISTS "owner_id_idx" ON "poll" ("owner_id");
CREATE INDEX IF NOT EXISTS "started_at_idx" ON "poll" ("started_at");
DO $$ BEGIN
 ALTER TABLE "poll_option" ADD CONSTRAINT "poll_option_poll_id_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "poll"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll" ADD CONSTRAINT "poll_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
