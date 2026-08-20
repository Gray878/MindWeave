/*
 Navicat Premium Data Transfer

 Source Server         : postgreSQL_local
 Source Server Type    : PostgreSQL
 Source Server Version : 160011 (160011)
 Source Host           : 127.0.0.1:5432
 Source Catalog        : pandawiki
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 160011 (160011)
 File Encoding         : 65001

 Date: 06/03/2026 00:00:27
*/


-- ----------------------------
-- Sequence structure for auth_configs_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."auth_configs_id_seq";
CREATE SEQUENCE "public"."auth_configs_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for auth_groups_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."auth_groups_id_seq";
CREATE SEQUENCE "public"."auth_groups_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for auths_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."auths_id_seq";
CREATE SEQUENCE "public"."auths_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for document_feedbacks_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."document_feedbacks_id_seq";
CREATE SEQUENCE "public"."document_feedbacks_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for kb_users_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."kb_users_id_seq";
CREATE SEQUENCE "public"."kb_users_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for licenses_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."licenses_id_seq";
CREATE SEQUENCE "public"."licenses_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for mcp_calls_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."mcp_calls_id_seq";
CREATE SEQUENCE "public"."mcp_calls_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for migrations_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."migrations_id_seq";
CREATE SEQUENCE "public"."migrations_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for node_auth_groups_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."node_auth_groups_id_seq";
CREATE SEQUENCE "public"."node_auth_groups_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for node_stats_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."node_stats_id_seq";
CREATE SEQUENCE "public"."node_stats_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for settings_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."settings_id_seq";
CREATE SEQUENCE "public"."settings_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for stat_page_hours_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."stat_page_hours_id_seq";
CREATE SEQUENCE "public"."stat_page_hours_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for stat_pages_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."stat_pages_id_seq";
CREATE SEQUENCE "public"."stat_pages_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for system_settings_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."system_settings_id_seq";
CREATE SEQUENCE "public"."system_settings_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Table structure for api_tokens
-- ----------------------------
DROP TABLE IF EXISTS "public"."api_tokens";
CREATE TABLE "public"."api_tokens" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "token" text COLLATE "pg_catalog"."default" NOT NULL,
  "permission" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT now(),
  "updated_at" timestamp(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for apps
-- ----------------------------
DROP TABLE IF EXISTS "public"."apps";
CREATE TABLE "public"."apps" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "kb_id" text COLLATE "pg_catalog"."default",
  "name" text COLLATE "pg_catalog"."default",
  "type" int2,
  "settings" jsonb,
  "created_at" timestamptz(6),
  "updated_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for auth_configs
-- ----------------------------
DROP TABLE IF EXISTS "public"."auth_configs";
CREATE TABLE "public"."auth_configs" (
  "id" int4 NOT NULL DEFAULT nextval('auth_configs_id_seq'::regclass),
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "auth_setting" jsonb,
  "source_type" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for auth_groups
-- ----------------------------
DROP TABLE IF EXISTS "public"."auth_groups";
CREATE TABLE "public"."auth_groups" (
  "id" int4 NOT NULL DEFAULT nextval('auth_groups_id_seq'::regclass),
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "auth_ids" int4[] DEFAULT '{}'::integer[],
  "created_at" timestamp(6) NOT NULL DEFAULT now(),
  "updated_at" timestamp(6) NOT NULL DEFAULT now(),
  "parent_id" int4,
  "position" float8 DEFAULT 0,
  "sync_id" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text,
  "sync_parent_id" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text,
  "source_type" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text
)
;

-- ----------------------------
-- Table structure for auths
-- ----------------------------
DROP TABLE IF EXISTS "public"."auths";
CREATE TABLE "public"."auths" (
  "id" int4 NOT NULL DEFAULT nextval('auths_id_seq'::regclass),
  "user_info" jsonb,
  "union_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "ip" text COLLATE "pg_catalog"."default" NOT NULL,
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "source_type" text COLLATE "pg_catalog"."default" NOT NULL,
  "last_login_time" timestamptz(6) NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS "public"."comments";
CREATE TABLE "public"."comments" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default",
  "node_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "info" jsonb,
  "parent_id" text COLLATE "pg_catalog"."default",
  "root_id" text COLLATE "pg_catalog"."default",
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(6),
  "status" int2 NOT NULL DEFAULT 0,
  "pic_urls" text[] COLLATE "pg_catalog"."default" NOT NULL DEFAULT ARRAY[]::text[]
)
;

-- ----------------------------
-- Table structure for contributes
-- ----------------------------
DROP TABLE IF EXISTS "public"."contributes";
CREATE TABLE "public"."contributes" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "auth_id" int8,
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "status" text COLLATE "pg_catalog"."default" NOT NULL,
  "type" text COLLATE "pg_catalog"."default" NOT NULL,
  "node_id" text COLLATE "pg_catalog"."default",
  "name" text COLLATE "pg_catalog"."default",
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "reason" text COLLATE "pg_catalog"."default" NOT NULL,
  "audit_user_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "meta" jsonb,
  "audit_time" timestamp(6),
  "created_at" timestamp(6) NOT NULL DEFAULT now(),
  "updated_at" timestamp(6) NOT NULL DEFAULT now(),
  "remote_ip" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text
)
;

-- ----------------------------
-- Table structure for conversation_messages
-- ----------------------------
DROP TABLE IF EXISTS "public"."conversation_messages";
CREATE TABLE "public"."conversation_messages" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "conversation_id" text COLLATE "pg_catalog"."default",
  "app_id" text COLLATE "pg_catalog"."default",
  "role" text COLLATE "pg_catalog"."default",
  "content" text COLLATE "pg_catalog"."default",
  "provider" text COLLATE "pg_catalog"."default",
  "model" text COLLATE "pg_catalog"."default",
  "prompt_tokens" int8 DEFAULT 0,
  "completion_tokens" int8 DEFAULT 0,
  "total_tokens" int8 DEFAULT 0,
  "remote_ip" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6),
  "info" jsonb DEFAULT '{}'::jsonb,
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text,
  "parent_id" text COLLATE "pg_catalog"."default" DEFAULT ''::text,
  "image_paths" text[] COLLATE "pg_catalog"."default" NOT NULL DEFAULT '{}'::text[]
)
;

-- ----------------------------
-- Table structure for conversation_references
-- ----------------------------
DROP TABLE IF EXISTS "public"."conversation_references";
CREATE TABLE "public"."conversation_references" (
  "conversation_id" text COLLATE "pg_catalog"."default",
  "app_id" text COLLATE "pg_catalog"."default",
  "node_id" text COLLATE "pg_catalog"."default",
  "name" text COLLATE "pg_catalog"."default",
  "url" text COLLATE "pg_catalog"."default",
  "favicon" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for conversations
-- ----------------------------
DROP TABLE IF EXISTS "public"."conversations";
CREATE TABLE "public"."conversations" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "nonce" text COLLATE "pg_catalog"."default",
  "kb_id" text COLLATE "pg_catalog"."default",
  "app_id" text COLLATE "pg_catalog"."default",
  "subject" text COLLATE "pg_catalog"."default",
  "remote_ip" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6),
  "info" jsonb
)
;

-- ----------------------------
-- Table structure for document_feedbacks
-- ----------------------------
DROP TABLE IF EXISTS "public"."document_feedbacks";
CREATE TABLE "public"."document_feedbacks" (
  "id" int8 NOT NULL DEFAULT nextval('document_feedbacks_id_seq'::regclass),
  "user_id" text COLLATE "pg_catalog"."default",
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "node_id" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text,
  "content" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text,
  "correction_suggestion" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text,
  "info" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for kb_release_node_releases
-- ----------------------------
DROP TABLE IF EXISTS "public"."kb_release_node_releases";
CREATE TABLE "public"."kb_release_node_releases" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "release_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "node_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "node_release_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for kb_releases
-- ----------------------------
DROP TABLE IF EXISTS "public"."kb_releases";
CREATE TABLE "public"."kb_releases" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "tag" text COLLATE "pg_catalog"."default",
  "message" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6),
  "publisher_id" text COLLATE "pg_catalog"."default" DEFAULT ''::text
)
;

-- ----------------------------
-- Table structure for kb_users
-- ----------------------------
DROP TABLE IF EXISTS "public"."kb_users";
CREATE TABLE "public"."kb_users" (
  "id" int8 NOT NULL DEFAULT nextval('kb_users_id_seq'::regclass),
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "perm" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'full_control'::text,
  "created_at" timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for knowledge_bases
-- ----------------------------
DROP TABLE IF EXISTS "public"."knowledge_bases";
CREATE TABLE "public"."knowledge_bases" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default",
  "access_settings" jsonb,
  "created_at" timestamptz(6),
  "updated_at" timestamptz(6),
  "dataset_id" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for licenses
-- ----------------------------
DROP TABLE IF EXISTS "public"."licenses";
CREATE TABLE "public"."licenses" (
  "id" int4 NOT NULL DEFAULT nextval('licenses_id_seq'::regclass),
  "type" text COLLATE "pg_catalog"."default",
  "code" text COLLATE "pg_catalog"."default",
  "data" bytea,
  "created_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for mcp_calls
-- ----------------------------
DROP TABLE IF EXISTS "public"."mcp_calls";
CREATE TABLE "public"."mcp_calls" (
  "id" int4 NOT NULL DEFAULT nextval('mcp_calls_id_seq'::regclass),
  "mcp_session_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "remote_ip" text COLLATE "pg_catalog"."default",
  "initialize_req" jsonb,
  "initialize_resp" jsonb,
  "tool_call_req" jsonb,
  "tool_call_resp" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for migrations
-- ----------------------------
DROP TABLE IF EXISTS "public"."migrations";
CREATE TABLE "public"."migrations" (
  "id" int4 NOT NULL DEFAULT nextval('migrations_id_seq'::regclass),
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "executed_at" timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for models
-- ----------------------------
DROP TABLE IF EXISTS "public"."models";
CREATE TABLE "public"."models" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "provider" text COLLATE "pg_catalog"."default",
  "model" text COLLATE "pg_catalog"."default",
  "api_key" text COLLATE "pg_catalog"."default",
  "api_header" text COLLATE "pg_catalog"."default",
  "base_url" text COLLATE "pg_catalog"."default",
  "api_version" text COLLATE "pg_catalog"."default",
  "prompt_tokens" int8 DEFAULT 0,
  "completion_tokens" int8 DEFAULT 0,
  "total_tokens" int8 DEFAULT 0,
  "created_at" timestamptz(6),
  "updated_at" timestamptz(6),
  "is_active" bool DEFAULT false,
  "type" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'chat'::character varying,
  "parameters" jsonb
)
;

-- ----------------------------
-- Table structure for node_auth_groups
-- ----------------------------
DROP TABLE IF EXISTS "public"."node_auth_groups";
CREATE TABLE "public"."node_auth_groups" (
  "id" int4 NOT NULL DEFAULT nextval('node_auth_groups_id_seq'::regclass),
  "node_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "auth_group_id" int4 NOT NULL,
  "perm" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT now(),
  "updated_at" timestamp(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for node_releases
-- ----------------------------
DROP TABLE IF EXISTS "public"."node_releases";
CREATE TABLE "public"."node_releases" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "node_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "doc_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "type" int2,
  "visibility" int2,
  "name" text COLLATE "pg_catalog"."default",
  "meta" jsonb,
  "content" text COLLATE "pg_catalog"."default",
  "parent_id" text COLLATE "pg_catalog"."default",
  "position" float8,
  "created_at" timestamptz(6),
  "updated_at" timestamptz(6),
  "publisher_id" text COLLATE "pg_catalog"."default" DEFAULT ''::text,
  "editor_id" text COLLATE "pg_catalog"."default" DEFAULT ''::text
)
;

-- ----------------------------
-- Table structure for node_stats
-- ----------------------------
DROP TABLE IF EXISTS "public"."node_stats";
CREATE TABLE "public"."node_stats" (
  "id" int8 NOT NULL DEFAULT nextval('node_stats_id_seq'::regclass),
  "node_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "pv" int8 NOT NULL DEFAULT 0,
  "created_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for nodes
-- ----------------------------
DROP TABLE IF EXISTS "public"."nodes";
CREATE TABLE "public"."nodes" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "kb_id" text COLLATE "pg_catalog"."default",
  "doc_id" text COLLATE "pg_catalog"."default",
  "type" int2,
  "name" text COLLATE "pg_catalog"."default",
  "content" text COLLATE "pg_catalog"."default",
  "meta" jsonb,
  "parent_id" text COLLATE "pg_catalog"."default",
  "position" float8,
  "created_at" timestamptz(6),
  "updated_at" timestamptz(6),
  "status" int2 NOT NULL DEFAULT 1,
  "visibility" int2 NOT NULL DEFAULT 1,
  "permissions" jsonb DEFAULT '{}'::jsonb,
  "creator_id" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text,
  "editor_id" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text,
  "edit_time" timestamp(6),
  "rag_info" jsonb DEFAULT '{}'::jsonb
)
;

-- ----------------------------
-- Table structure for schema_migrations
-- ----------------------------
DROP TABLE IF EXISTS "public"."schema_migrations";
CREATE TABLE "public"."schema_migrations" (
  "version" int8 NOT NULL,
  "dirty" bool NOT NULL
)
;

-- ----------------------------
-- Table structure for settings
-- ----------------------------
DROP TABLE IF EXISTS "public"."settings";
CREATE TABLE "public"."settings" (
  "id" int4 NOT NULL DEFAULT nextval('settings_id_seq'::regclass),
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "key" text COLLATE "pg_catalog"."default" NOT NULL,
  "value" jsonb NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for stat_page_hours
-- ----------------------------
DROP TABLE IF EXISTS "public"."stat_page_hours";
CREATE TABLE "public"."stat_page_hours" (
  "id" int8 NOT NULL DEFAULT nextval('stat_page_hours_id_seq'::regclass),
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "hour" timestamptz(6) NOT NULL,
  "ip_count" int8 NOT NULL DEFAULT 0,
  "session_count" int8 NOT NULL DEFAULT 0,
  "page_visit_count" int8 NOT NULL DEFAULT 0,
  "conversation_count" int8 NOT NULL DEFAULT 0,
  "geo_count" jsonb,
  "conversation_distribution" jsonb,
  "hot_referer_host" jsonb,
  "hot_page" jsonb,
  "hot_os" jsonb,
  "hot_browser" jsonb,
  "created_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for stat_pages
-- ----------------------------
DROP TABLE IF EXISTS "public"."stat_pages";
CREATE TABLE "public"."stat_pages" (
  "id" int8 NOT NULL DEFAULT nextval('stat_pages_id_seq'::regclass),
  "kb_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "node_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" int8,
  "session_id" text COLLATE "pg_catalog"."default",
  "scene" int4 NOT NULL,
  "ip" text COLLATE "pg_catalog"."default",
  "ua" text COLLATE "pg_catalog"."default",
  "browser_name" text COLLATE "pg_catalog"."default",
  "browser_os" text COLLATE "pg_catalog"."default",
  "referer" text COLLATE "pg_catalog"."default",
  "referer_host" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for system_settings
-- ----------------------------
DROP TABLE IF EXISTS "public"."system_settings";
CREATE TABLE "public"."system_settings" (
  "id" int4 NOT NULL DEFAULT nextval('system_settings_id_seq'::regclass),
  "key" text COLLATE "pg_catalog"."default" NOT NULL,
  "value" jsonb NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "account" text COLLATE "pg_catalog"."default",
  "password" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6),
  "last_access" timestamptz(6),
  "role" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'user'::text
)
;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."auth_configs_id_seq"
OWNED BY "public"."auth_configs"."id";
SELECT setval('"public"."auth_configs_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."auth_groups_id_seq"
OWNED BY "public"."auth_groups"."id";
SELECT setval('"public"."auth_groups_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."auths_id_seq"
OWNED BY "public"."auths"."id";
SELECT setval('"public"."auths_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."document_feedbacks_id_seq"
OWNED BY "public"."document_feedbacks"."id";
SELECT setval('"public"."document_feedbacks_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."kb_users_id_seq"
OWNED BY "public"."kb_users"."id";
SELECT setval('"public"."kb_users_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."licenses_id_seq"
OWNED BY "public"."licenses"."id";
SELECT setval('"public"."licenses_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."mcp_calls_id_seq"
OWNED BY "public"."mcp_calls"."id";
SELECT setval('"public"."mcp_calls_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."migrations_id_seq"
OWNED BY "public"."migrations"."id";
SELECT setval('"public"."migrations_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."node_auth_groups_id_seq"
OWNED BY "public"."node_auth_groups"."id";
SELECT setval('"public"."node_auth_groups_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."node_stats_id_seq"
OWNED BY "public"."node_stats"."id";
SELECT setval('"public"."node_stats_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."settings_id_seq"
OWNED BY "public"."settings"."id";
SELECT setval('"public"."settings_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."stat_page_hours_id_seq"
OWNED BY "public"."stat_page_hours"."id";
SELECT setval('"public"."stat_page_hours_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."stat_pages_id_seq"
OWNED BY "public"."stat_pages"."id";
SELECT setval('"public"."stat_pages_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."system_settings_id_seq"
OWNED BY "public"."system_settings"."id";
SELECT setval('"public"."system_settings_id_seq"', 1, true);

-- ----------------------------
-- Uniques structure for table api_tokens
-- ----------------------------
ALTER TABLE "public"."api_tokens" ADD CONSTRAINT "api_tokens_token_key" UNIQUE ("token");

-- ----------------------------
-- Primary Key structure for table api_tokens
-- ----------------------------
ALTER TABLE "public"."api_tokens" ADD CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table apps
-- ----------------------------
CREATE UNIQUE INDEX "idx_apps_kb_id_type" ON "public"."apps" USING btree (
  "kb_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "type" "pg_catalog"."int2_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table apps
-- ----------------------------
ALTER TABLE "public"."apps" ADD CONSTRAINT "apps_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table auth_configs
-- ----------------------------
ALTER TABLE "public"."auth_configs" ADD CONSTRAINT "uniq_auth_configs_source_type_kb_id" UNIQUE ("source_type", "kb_id");

-- ----------------------------
-- Primary Key structure for table auth_configs
-- ----------------------------
ALTER TABLE "public"."auth_configs" ADD CONSTRAINT "auth_configs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table auth_groups
-- ----------------------------
ALTER TABLE "public"."auth_groups" ADD CONSTRAINT "auth_groups_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table auths
-- ----------------------------
ALTER TABLE "public"."auths" ADD CONSTRAINT "auths_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table comments
-- ----------------------------
CREATE INDEX "idx_comments_kb_id" ON "public"."comments" USING btree (
  "kb_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_comments_node_id" ON "public"."comments" USING btree (
  "node_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table comments
-- ----------------------------
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table contributes
-- ----------------------------
ALTER TABLE "public"."contributes" ADD CONSTRAINT "contributes_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table conversation_messages
-- ----------------------------
CREATE INDEX "idx_conversation_messages_app_id" ON "public"."conversation_messages" USING btree (
  "app_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_conversation_messages_conversation_id" ON "public"."conversation_messages" USING btree (
  "conversation_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table conversation_messages
-- ----------------------------
ALTER TABLE "public"."conversation_messages" ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table conversation_references
-- ----------------------------
CREATE INDEX "idx_conversation_references_conversation_id" ON "public"."conversation_references" USING btree (
  "conversation_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Indexes structure for table conversations
-- ----------------------------
CREATE INDEX "idx_conversations_app_id" ON "public"."conversations" USING btree (
  "app_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_conversations_kb_id" ON "public"."conversations" USING btree (
  "kb_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table conversations
-- ----------------------------
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table document_feedbacks
-- ----------------------------
ALTER TABLE "public"."document_feedbacks" ADD CONSTRAINT "document_feedbacks_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table kb_release_node_releases
-- ----------------------------
CREATE INDEX "idx_kb_release_node_releases_kb_id" ON "public"."kb_release_node_releases" USING btree (
  "kb_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_kb_release_node_releases_node_id" ON "public"."kb_release_node_releases" USING btree (
  "node_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_kb_release_node_releases_release_id_node_release_id" ON "public"."kb_release_node_releases" USING btree (
  "release_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "node_release_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table kb_release_node_releases
-- ----------------------------
ALTER TABLE "public"."kb_release_node_releases" ADD CONSTRAINT "kb_release_node_releases_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table kb_releases
-- ----------------------------
CREATE INDEX "idx_kb_releases_kb_id" ON "public"."kb_releases" USING btree (
  "kb_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table kb_releases
-- ----------------------------
ALTER TABLE "public"."kb_releases" ADD CONSTRAINT "kb_releases_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table kb_users
-- ----------------------------
ALTER TABLE "public"."kb_users" ADD CONSTRAINT "uniq_kb_users_kb_id_user_id" UNIQUE ("kb_id", "user_id");

-- ----------------------------
-- Primary Key structure for table kb_users
-- ----------------------------
ALTER TABLE "public"."kb_users" ADD CONSTRAINT "kb_users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table knowledge_bases
-- ----------------------------
ALTER TABLE "public"."knowledge_bases" ADD CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table licenses
-- ----------------------------
ALTER TABLE "public"."licenses" ADD CONSTRAINT "licenses_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table mcp_calls
-- ----------------------------
ALTER TABLE "public"."mcp_calls" ADD CONSTRAINT "mcp_calls_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table migrations
-- ----------------------------
CREATE UNIQUE INDEX "idx_migrations_name" ON "public"."migrations" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table migrations
-- ----------------------------
ALTER TABLE "public"."migrations" ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table models
-- ----------------------------
CREATE UNIQUE INDEX "idx_models_type" ON "public"."models" USING btree (
  "type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table models
-- ----------------------------
ALTER TABLE "public"."models" ADD CONSTRAINT "models_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table node_auth_groups
-- ----------------------------
ALTER TABLE "public"."node_auth_groups" ADD CONSTRAINT "node_auth_groups_node_id_auth_group_id_perm_key" UNIQUE ("node_id", "auth_group_id", "perm");

-- ----------------------------
-- Primary Key structure for table node_auth_groups
-- ----------------------------
ALTER TABLE "public"."node_auth_groups" ADD CONSTRAINT "node_auth_groups_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table node_releases
-- ----------------------------
CREATE INDEX "idx_node_releases_doc_id" ON "public"."node_releases" USING btree (
  "doc_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_node_releases_kb_id" ON "public"."node_releases" USING btree (
  "kb_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_node_releases_node_id" ON "public"."node_releases" USING btree (
  "node_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table node_releases
-- ----------------------------
ALTER TABLE "public"."node_releases" ADD CONSTRAINT "node_releases_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table node_stats
-- ----------------------------
ALTER TABLE "public"."node_stats" ADD CONSTRAINT "node_stats_node_id_key" UNIQUE ("node_id");

-- ----------------------------
-- Primary Key structure for table node_stats
-- ----------------------------
ALTER TABLE "public"."node_stats" ADD CONSTRAINT "node_stats_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table nodes
-- ----------------------------
CREATE INDEX "idx_nodes_doc_id" ON "public"."nodes" USING btree (
  "doc_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_nodes_kb_id" ON "public"."nodes" USING btree (
  "kb_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_nodes_parent_id" ON "public"."nodes" USING btree (
  "parent_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table nodes
-- ----------------------------
ALTER TABLE "public"."nodes" ADD CONSTRAINT "nodes_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table schema_migrations
-- ----------------------------
ALTER TABLE "public"."schema_migrations" ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");

-- ----------------------------
-- Indexes structure for table settings
-- ----------------------------
CREATE UNIQUE INDEX "idx_settings_kb_id_key" ON "public"."settings" USING btree (
  "kb_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "key" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table settings
-- ----------------------------
ALTER TABLE "public"."settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table stat_page_hours
-- ----------------------------
CREATE INDEX "idx_stat_page_hours_hour" ON "public"."stat_page_hours" USING btree (
  "hour" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table stat_page_hours
-- ----------------------------
ALTER TABLE "public"."stat_page_hours" ADD CONSTRAINT "stat_page_hours_kb_id_hour_key" UNIQUE ("kb_id", "hour");

-- ----------------------------
-- Primary Key structure for table stat_page_hours
-- ----------------------------
ALTER TABLE "public"."stat_page_hours" ADD CONSTRAINT "stat_page_hours_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table stat_pages
-- ----------------------------
CREATE INDEX "idx_stat_pages_kb_id_node_id" ON "public"."stat_pages" USING btree (
  "kb_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "node_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table stat_pages
-- ----------------------------
ALTER TABLE "public"."stat_pages" ADD CONSTRAINT "stat_pages_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table system_settings
-- ----------------------------
CREATE UNIQUE INDEX "idx_uniq_system_settings_key" ON "public"."system_settings" USING btree (
  "key" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table system_settings
-- ----------------------------
ALTER TABLE "public"."system_settings" ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE UNIQUE INDEX "idx_users_account" ON "public"."users" USING btree (
  "account" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
