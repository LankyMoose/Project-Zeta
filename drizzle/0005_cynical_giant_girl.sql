ALTER TABLE "user" ADD COLUMN "web_id" uuid DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS "name_idx" ON "user" ("username");
CREATE INDEX IF NOT EXISTS "web_id_idx" ON "user" ("web_id");