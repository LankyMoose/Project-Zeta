ALTER TABLE "poll" ADD COLUMN "web_id" uuid DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS "web_id_idx" ON "poll" ("web_id");