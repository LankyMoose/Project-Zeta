CREATE TABLE IF NOT EXISTS "poll_option" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"desc" varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS "poll_vote" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"option_id" integer NOT NULL,
	"user_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "poll" (
	"id" serial PRIMARY KEY NOT NULL,
	"web_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" integer NOT NULL,
	"owner_web_id" uuid NOT NULL,
	"desc" varchar(255) NOT NULL,
	"started_at" date DEFAULT now() NOT NULL,
	"ended_at" date,
	"disabled" boolean DEFAULT false,
	UNIQUE ("web_id")
);

CREATE TABLE IF NOT EXISTS "user_auth" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(80) NOT NULL,
	"user_id" integer NOT NULL,
	"provider" varchar(80) NOT NULL,
	"provider_id" varchar(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"web_id" uuid DEFAULT gen_random_uuid(),
	"username" varchar(80) NOT NULL,
	"created_at" date DEFAULT now(),
	"disabled" boolean DEFAULT false,
	"avatar_url" varchar(255),
	UNIQUE ("web_id")
);

CREATE INDEX IF NOT EXISTS "poll_id_idx" ON "poll_option" ("poll_id");
CREATE INDEX IF NOT EXISTS "poll_id_idx" ON "poll_vote" ("poll_id");
CREATE INDEX IF NOT EXISTS "option_id_idx" ON "poll_vote" ("option_id");
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "poll_vote" ("user_id");
CREATE INDEX IF NOT EXISTS "web_id_idx" ON "poll" ("web_id");
CREATE INDEX IF NOT EXISTS "owner_id_idx" ON "poll" ("owner_id");
CREATE INDEX IF NOT EXISTS "started_at_idx" ON "poll" ("started_at");
CREATE INDEX IF NOT EXISTS "email_idx" ON "user_auth" ("email");
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "user_auth" ("user_id");
CREATE INDEX IF NOT EXISTS "provider_id_idx" ON "user_auth" ("provider_id");
CREATE INDEX IF NOT EXISTS "name_idx" ON "user" ("username");
CREATE INDEX IF NOT EXISTS "web_id_idx" ON "user" ("web_id");
DO $$ BEGIN
 ALTER TABLE "poll_option" ADD CONSTRAINT "poll_option_poll_id_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "poll"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_poll_id_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "poll"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_option_id_poll_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "poll_option"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll" ADD CONSTRAINT "poll_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll" ADD CONSTRAINT "poll_owner_web_id_user_web_id_fk" FOREIGN KEY ("owner_web_id") REFERENCES "user"("web_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_auth" ADD CONSTRAINT "user_auth_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
