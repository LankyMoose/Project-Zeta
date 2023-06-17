CREATE TABLE IF NOT EXISTS "user_auth" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(80) NOT NULL,
	"user_id" integer NOT NULL,
	"provider" varchar(80) NOT NULL,
	"provider_id" varchar(80) NOT NULL,
	CONSTRAINT user_auth_unique_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS "email_idx" ON "user_auth" ("email");
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "user_auth" ("user_id");
CREATE INDEX IF NOT EXISTS "provider_id_idx" ON "user_auth" ("provider_id");
DO $$ BEGIN
 ALTER TABLE "user_auth" ADD CONSTRAINT "user_auth_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
