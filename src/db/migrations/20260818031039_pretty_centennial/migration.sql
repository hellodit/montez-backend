CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" text PRIMARY KEY,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" bigserial PRIMARY KEY,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"follower_count" integer,
	"is_verified" boolean DEFAULT false,
	"market_tag" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" bigserial PRIMARY KEY,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"platform" text NOT NULL,
	"target_url" text NOT NULL,
	"account_id" bigint,
	"status" text DEFAULT 'queued' NOT NULL,
	"progress" jsonb DEFAULT '{"stage":"queued","done":0,"total":0,"failed":0}' NOT NULL,
	"requested_limit" integer,
	"error" text,
	"report" jsonb,
	"recommendations" jsonb,
	"token_cost" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" bigserial PRIMARY KEY,
	"audit_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"account_id" bigint,
	"platform" text NOT NULL,
	"platform_id" text NOT NULL,
	"caption" text,
	"hashtags" text[],
	"duration_sec" integer,
	"posted_at" timestamp,
	"media_object_key" text,
	"cover_object_key" text,
	"sound_name" text,
	"is_sponsored" boolean DEFAULT false,
	"scraped_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagement_snapshots" (
	"id" bigserial PRIMARY KEY,
	"post_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"snapshot_type" text DEFAULT 't0' NOT NULL,
	"views" bigint,
	"likes" bigint,
	"comments_count" bigint,
	"shares" bigint,
	"saves" bigint,
	"reach" bigint,
	"impressions" bigint,
	"watch_time_ms" bigint,
	"total_interactions" bigint,
	"avg_watch_time_ms" bigint,
	"profile_visits" bigint,
	"follows_from_post" bigint,
	"engagement_rate" real,
	"scraped_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" bigserial PRIMARY KEY,
	"post_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"username" text,
	"text" text NOT NULL,
	"likes" integer DEFAULT 0,
	"is_buying_signal" boolean DEFAULT false,
	"is_follow_signal" boolean DEFAULT false,
	"is_desire_signal" boolean DEFAULT false,
	"posted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" bigserial PRIMARY KEY,
	"post_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"kasta_hook" text,
	"hook_type" text,
	"hook_strength" integer,
	"hook_efficiency" real,
	"psychological_mechanism" text,
	"emotional_arc" text,
	"structure" text,
	"tone" text,
	"cta_type" text,
	"format" text,
	"production_level" text,
	"content_pillar" text,
	"sentiment" text,
	"video_length_category" text,
	"posting_hour" integer,
	"posting_day" text,
	"views_log_zscore" real,
	"visibility_score" real,
	"engagement_score" real,
	"performance_tier" text,
	"virality_multiplier" real,
	"retention_pct" real,
	"why_it_works" text,
	"transcript_raw" text,
	"details" jsonb DEFAULT '{}',
	"analyzed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patterns" (
	"id" bigserial PRIMARY KEY,
	"user_id" text NOT NULL,
	"audit_id" bigint,
	"pattern_name" text,
	"ingredients" jsonb NOT NULL,
	"sample_size" integer,
	"avg_engagement_rate" real,
	"confidence" real,
	"platform" text,
	"discovered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_credentials" (
	"id" bigserial PRIMARY KEY,
	"user_id" text NOT NULL,
	"account_id" bigint NOT NULL,
	"provider" text DEFAULT 'meta' NOT NULL,
	"access_token" text NOT NULL,
	"meta_ig_business_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_demographics" (
	"id" bigserial PRIMARY KEY,
	"user_id" text NOT NULL,
	"account_id" bigint NOT NULL,
	"metric" text NOT NULL,
	"breakdown" text NOT NULL,
	"timeframe" text,
	"data" jsonb NOT NULL,
	"total" integer,
	"snapshot_date" text,
	"scraped_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" bigserial PRIMARY KEY,
	"user_id" text NOT NULL,
	"title" text,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" bigserial PRIMARY KEY,
	"conversation_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" bigserial PRIMARY KEY,
	"is_chatable" boolean DEFAULT false NOT NULL,
	"name" varchar(256),
	"description" text,
	"organization_name" varchar(256),
	"organization_description" text,
	"interaction_rules" text,
	"prompt_injection" boolean DEFAULT true NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledgebases" (
	"id" bigserial PRIMARY KEY,
	"name" varchar(256),
	"description" text,
	"content" text,
	"metadata" jsonb,
	"training_status" varchar(20) DEFAULT 'idle' NOT NULL,
	"trained_at" timestamp,
	"agent_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" bigserial PRIMARY KEY,
	"knowledgebase_id" bigint NOT NULL,
	"agent_id" bigint NOT NULL,
	"chunk_index" integer NOT NULL,
	"original_content" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"heading" text,
	"token_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_webhooks" (
	"id" bigserial PRIMARY KEY,
	"agent_id" bigint NOT NULL,
	"url" text NOT NULL,
	"headers" jsonb DEFAULT '{}' NOT NULL,
	"events" jsonb DEFAULT '["bot.reply"]' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_usages" (
	"id" bigserial PRIMARY KEY,
	"conversation_id" bigint,
	"agent_id" bigint,
	"type" varchar(16) DEFAULT 'chat' NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"model" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_transactions" (
	"id" bigserial PRIMARY KEY,
	"user_id" text NOT NULL,
	"order_id" text NOT NULL UNIQUE,
	"plan_id" text NOT NULL,
	"period_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"snap_token" text,
	"midtrans_transaction_id" text,
	"payment_type" text,
	"subscription_expires_at" timestamp,
	"raw_notification" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "social_accounts_user_platform_username" ON "social_accounts" ("user_id","platform","username");--> statement-breakpoint
CREATE INDEX "audits_user_status" ON "audits" ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_user_platform_platform_id" ON "posts" ("user_id","platform","platform_id");--> statement-breakpoint
CREATE INDEX "posts_audit" ON "posts" ("audit_id");--> statement-breakpoint
CREATE INDEX "engagement_post" ON "engagement_snapshots" ("post_id","snapshot_type");--> statement-breakpoint
CREATE INDEX "comments_post_signals" ON "comments" ("post_id","is_buying_signal");--> statement-breakpoint
CREATE UNIQUE INDEX "ingredients_post" ON "ingredients" ("post_id");--> statement-breakpoint
CREATE INDEX "ingredients_user_tier" ON "ingredients" ("user_id","performance_tier");--> statement-breakpoint
CREATE INDEX "ingredients_user_kasta" ON "ingredients" ("user_id","kasta_hook");--> statement-breakpoint
CREATE UNIQUE INDEX "account_credentials_account" ON "account_credentials" ("account_id");--> statement-breakpoint
CREATE INDEX "account_demographics_user_account" ON "account_demographics" ("user_id","account_id");--> statement-breakpoint
CREATE INDEX "chat_conversations_user_last" ON "chat_conversations" ("user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "chat_messages_conversation_created" ON "chat_messages" ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "agents_user_created" ON "agents" ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_is_chatable_uq" ON "agents" ("is_chatable") WHERE "is_chatable";--> statement-breakpoint
CREATE INDEX "knowledgebases_agent_created" ON "knowledgebases" ("agent_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledgebases_agent_name_uq" ON "knowledgebases" ("agent_id","name");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_embedding_hnsw" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "knowledge_chunks_agent_id_idx" ON "knowledge_chunks" ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_chunks_kb_chunk_uq" ON "knowledge_chunks" ("knowledgebase_id","chunk_index");--> statement-breakpoint
CREATE INDEX "agent_webhooks_agent_id_idx" ON "agent_webhooks" ("agent_id");--> statement-breakpoint
CREATE INDEX "token_usages_conversation_created_idx" ON "token_usages" ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "token_usages_created_idx" ON "token_usages" ("created_at");--> statement-breakpoint
CREATE INDEX "token_usages_agent_id_idx" ON "token_usages" ("agent_id");--> statement-breakpoint
CREATE INDEX "subscription_transactions_user_id_idx" ON "subscription_transactions" ("user_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_account_id_social_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "social_accounts"("id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_audit_id_audits_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_account_id_social_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "social_accounts"("id");--> statement-breakpoint
ALTER TABLE "engagement_snapshots" ADD CONSTRAINT "engagement_snapshots_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id");--> statement-breakpoint
ALTER TABLE "engagement_snapshots" ADD CONSTRAINT "engagement_snapshots_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id");--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_audit_id_audits_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id");--> statement-breakpoint
ALTER TABLE "account_credentials" ADD CONSTRAINT "account_credentials_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "account_credentials" ADD CONSTRAINT "account_credentials_account_id_social_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "social_accounts"("id");--> statement-breakpoint
ALTER TABLE "account_demographics" ADD CONSTRAINT "account_demographics_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "account_demographics" ADD CONSTRAINT "account_demographics_account_id_social_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "social_accounts"("id");--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knowledgebases" ADD CONSTRAINT "knowledgebases_agent_id_agents_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_knowledgebase_id_knowledgebases_id_fkey" FOREIGN KEY ("knowledgebase_id") REFERENCES "knowledgebases"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_agent_id_agents_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "agent_webhooks" ADD CONSTRAINT "agent_webhooks_agent_id_agents_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "token_usages" ADD CONSTRAINT "token_usages_conversation_id_chat_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "token_usages" ADD CONSTRAINT "token_usages_agent_id_agents_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "subscription_transactions" ADD CONSTRAINT "subscription_transactions_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;