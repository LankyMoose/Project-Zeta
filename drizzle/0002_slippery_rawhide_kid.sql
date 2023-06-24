ALTER TABLE "community" DROP CONSTRAINT "community_owner_id_user_id_fk";

DROP INDEX IF EXISTS "community_owner_id_idx";
CREATE INDEX IF NOT EXISTS "community_title_idx" ON "community" ("title");
ALTER TABLE "community" DROP COLUMN IF EXISTS "owner_id";