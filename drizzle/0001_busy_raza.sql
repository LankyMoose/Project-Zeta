DO $$ BEGIN
 CREATE TYPE "community_member_type" AS ENUM('member', 'moderator', 'owner');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "post_content_type" AS ENUM('poll', 'image', 'video');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

create or replace function now_utc() returns timestamp as $$
  select now() at time zone 'utc';
$$ language sql;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS "community" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(128) NOT NULL,
	"url_title" varchar(128) UNIQUE GENERATED ALWAYS AS (lower(replace(replace(replace(replace("title", ' ', '-'), '_', ''), '(', ''), ')', ''))) STORED,
	"description" varchar(255) NOT NULL,
	"created_at" timestamp WITHOUT TIME ZONE DEFAULT now_utc() NOT NULL,
	"disabled" boolean DEFAULT false,
	"private" boolean DEFAULT false,
	UNIQUE ("url_title"),
	UNIQUE ("title")
);

CREATE TABLE IF NOT EXISTS "community_join_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp WITHOUT TIME ZONE DEFAULT now_utc() NOT NULL,
	"response" boolean,
	"responded_at" timestamp WITHOUT TIME ZONE DEFAULT now_utc() NOT NULL,
	"responded_by" uuid,
	UNIQUE ("community_id", "user_id")
);


CREATE TABLE IF NOT EXISTS "community_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp WITHOUT TIME ZONE DEFAULT now_utc() NOT NULL,
	"disabled" boolean DEFAULT false,
	"member_types" community_member_type DEFAULT 'member' NOT NULL,
	UNIQUE ("community_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "poll_option" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"desc" varchar(32) NOT NULL,
	UNIQUE ("poll_id", "desc")
);

CREATE TABLE IF NOT EXISTS "poll_vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	UNIQUE ("poll_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "poll" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"desc" varchar(255) NOT NULL,
	"started_at" timestamp WITHOUT TIME ZONE DEFAULT now_utc() NOT NULL,
	"ended_at" timestamp,
	"disabled" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "post_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"content" varchar(255) NOT NULL,
	"created_at" timestamp WITHOUT TIME ZONE DEFAULT now_utc() NOT NULL,
	"deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "post_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"type" post_content_type NOT NULL,
	UNIQUE ("post_id")
);

CREATE TABLE IF NOT EXISTS "post_reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"reaction" boolean NOT NULL,
	UNIQUE ("post_id", "owner_id")
);

CREATE TABLE IF NOT EXISTS "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(128) NOT NULL,
	"content" varchar(2048) NOT NULL,
	"created_at" timestamp WITHOUT TIME ZONE DEFAULT now_utc() NOT NULL,
	"disabled" boolean DEFAULT false,
	"deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "user_auth" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(80) NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(80) NOT NULL,
	"provider_id" varchar(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(80) NOT NULL,
	"created_at" timestamp WITHOUT TIME ZONE DEFAULT now_utc() NOT NULL,
	"disabled" boolean DEFAULT false,
	"avatar_url" varchar(255),
	"deleted" boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS "community_created_at_idx" ON "community" ("created_at");
CREATE INDEX IF NOT EXISTS "community_title_idx" ON "community" ("title");
CREATE INDEX IF NOT EXISTS "community_url_title_idx" ON "community" ("title");
CREATE INDEX IF NOT EXISTS "community_join_request_community_id_idx" ON "community_join_request" ("community_id");
CREATE INDEX IF NOT EXISTS "community_join_request_user_id_idx" ON "community_join_request" ("user_id");
CREATE INDEX IF NOT EXISTS "community_join_request_responded_by_idx" ON "community_join_request" ("responded_by");
CREATE INDEX IF NOT EXISTS "community_member_community_id_idx" ON "community_member" ("community_id");
CREATE INDEX IF NOT EXISTS "community_member_user_id_idx" ON "community_member" ("user_id");
CREATE INDEX IF NOT EXISTS "poll_option_poll_id_idx" ON "poll_option" ("poll_id");
CREATE INDEX IF NOT EXISTS "poll_vote_poll_id_idx" ON "poll_vote" ("poll_id");
CREATE INDEX IF NOT EXISTS "poll_vote_option_id_idx" ON "poll_vote" ("option_id");
CREATE INDEX IF NOT EXISTS "poll_vote_user_id_idx" ON "poll_vote" ("user_id");
CREATE INDEX IF NOT EXISTS "poll_post_id_idx" ON "poll" ("post_id");
CREATE INDEX IF NOT EXISTS "poll_started_at_idx" ON "poll" ("started_at");
CREATE INDEX IF NOT EXISTS "post_comment_post_id_idx" ON "post_comment" ("post_id");
CREATE INDEX IF NOT EXISTS "post_comment_owner_id_idx" ON "post_comment" ("owner_id");
CREATE INDEX IF NOT EXISTS "post_comment_created_at_idx" ON "post_comment" ("created_at");
CREATE INDEX IF NOT EXISTS "post_content_post_id_idx" ON "post_content" ("post_id");
CREATE INDEX IF NOT EXISTS "post_reaction_post_id_idx" ON "post_reaction" ("post_id");
CREATE INDEX IF NOT EXISTS "post_reaction_owner_id_idx" ON "post_reaction" ("owner_id");
CREATE INDEX IF NOT EXISTS "post_community_id_idx" ON "post" ("community_id");
CREATE INDEX IF NOT EXISTS "post_owner_id_idx" ON "post" ("owner_id");
CREATE INDEX IF NOT EXISTS "post_created_at_idx" ON "post" ("created_at");
CREATE INDEX IF NOT EXISTS "user_auth_email_idx" ON "user_auth" ("email");
CREATE INDEX IF NOT EXISTS "user_auth_user_id_idx" ON "user_auth" ("user_id");
CREATE INDEX IF NOT EXISTS "user_auth_provider_id_idx" ON "user_auth" ("provider_id");
CREATE INDEX IF NOT EXISTS "user_name_idx" ON "user" ("username");

DO $$ BEGIN
 ALTER TABLE "community_join_request" ADD CONSTRAINT "community_join_request_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "community"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "community_member" ADD CONSTRAINT "community_member_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "community"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "community_member" ADD CONSTRAINT "community_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll_option" ADD CONSTRAINT "poll_option_poll_id_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "poll"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_poll_id_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "poll"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_option_id_poll_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "poll_option"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "poll" ADD CONSTRAINT "poll_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_comment" ADD CONSTRAINT "post_comment_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_comment" ADD CONSTRAINT "post_comment_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_content" ADD CONSTRAINT "post_content_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_reaction" ADD CONSTRAINT "post_reaction_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post_reaction" ADD CONSTRAINT "post_reaction_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "community"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_auth" ADD CONSTRAINT "user_auth_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
