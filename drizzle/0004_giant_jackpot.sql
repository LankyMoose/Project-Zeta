-- add 'url_title' column to community table, which is a url-friendly version of the title
-- it is generated from the title, and is used in the url for the community page
-- it should return content from the 'title' column, but with spaces replaced with dashes, dashes replaced with underscores, and all lowercase
-- it should also be unique, and have a max length of 128 characters
ALTER TABLE "community" ADD COLUMN "url_title" varchar(128) UNIQUE GENERATED ALWAYS AS (lower(replace(replace("title", '-', '_'), ' ', '-'))) STORED;
-- create index on url_title
CREATE INDEX IF NOT EXISTS "community_url_title_idx" ON "community" ("url_title");

ALTER TABLE "community" ADD COLUMN "private" boolean DEFAULT false;
