CREATE TABLE IF NOT EXISTS "community_nsfw_agreement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"agreed_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "community" ADD COLUMN "nsfw" boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS "community_nsfw_agreement_community_id_idx" ON "community_nsfw_agreement" ("community_id");
CREATE INDEX IF NOT EXISTS "community_nsfw_agreement_user_id_idx" ON "community_nsfw_agreement" ("user_id");
DO $$ BEGIN
 ALTER TABLE "community_nsfw_agreement" ADD CONSTRAINT "community_nsfw_agreement_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "community"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "community_nsfw_agreement" ADD CONSTRAINT "community_nsfw_agreement_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
