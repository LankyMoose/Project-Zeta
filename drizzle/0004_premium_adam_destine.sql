CREATE TABLE IF NOT EXISTS "post_multimedia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"url" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "post_comment_reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"reaction" boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS "post_comment_reply" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"content" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "post_comment_reply_reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reply_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"reaction" boolean NOT NULL
);

DROP TABLE "post_content";
CREATE INDEX IF NOT EXISTS "post_multimedia_post_id_idx" ON "post_multimedia" ("post_id");
CREATE INDEX IF NOT EXISTS "post_multimedia_created_at_idx" ON "post_multimedia" ("created_at");
CREATE INDEX IF NOT EXISTS "post_comment_reaction_comment_id_idx" ON "post_comment_reaction" ("comment_id");
CREATE INDEX IF NOT EXISTS "post_comment_reaction_owner_id_idx" ON "post_comment_reaction" ("owner_id");
CREATE INDEX IF NOT EXISTS "post_comment_reply_comment_id_idx" ON "post_comment_reply" ("comment_id");
CREATE INDEX IF NOT EXISTS "post_comment_reply_owner_id_idx" ON "post_comment_reply" ("owner_id");
CREATE INDEX IF NOT EXISTS "post_comment_reply_created_at_idx" ON "post_comment_reply" ("created_at");
CREATE INDEX IF NOT EXISTS "post_comment_reply_reaction_reply_id_idx" ON "post_comment_reply_reaction" ("reply_id");
CREATE INDEX IF NOT EXISTS "post_comment_reply_reaction_owner_id_idx" ON "post_comment_reply_reaction" ("owner_id");
DO $$ BEGIN
 ALTER TABLE "post_multimedia" ADD CONSTRAINT "post_multimedia_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_comment_reaction" ADD CONSTRAINT "post_comment_reaction_comment_id_post_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "post_comment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_comment_reaction" ADD CONSTRAINT "post_comment_reaction_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_comment_reply" ADD CONSTRAINT "post_comment_reply_comment_id_post_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "post_comment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_comment_reply" ADD CONSTRAINT "post_comment_reply_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_comment_reply_reaction" ADD CONSTRAINT "post_comment_reply_reaction_reply_id_post_comment_reply_id_fk" FOREIGN KEY ("reply_id") REFERENCES "post_comment_reply"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_comment_reply_reaction" ADD CONSTRAINT "post_comment_reply_reaction_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
