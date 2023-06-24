DO $$ BEGIN
 CREATE TYPE "community_member_type" AS ENUM('member', 'moderator', 'owner');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "community_member" ADD COLUMN "member_types" "community_member_type" DEFAULT 'member' NOT NULL;