CREATE TYPE "public"."skill_category" AS ENUM('core', 'production', 'professional');--> statement-breakpoint
CREATE TABLE "role_taxonomies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "role_taxonomies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" varchar(100) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text NOT NULL,
	"version" integer NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_taxonomies_slug_version_unique" UNIQUE("slug","version")
);
--> statement-breakpoint
CREATE TABLE "role_skills" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "role_skills_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"taxonomyId" integer NOT NULL,
	"skillKey" varchar(100) NOT NULL,
	"skillName" varchar(150) NOT NULL,
	"category" "skill_category" NOT NULL,
	"weight" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_skills_taxonomyId_skillKey_unique" UNIQUE("taxonomyId","skillKey")
);
--> statement-breakpoint
CREATE TABLE "user_role_targets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_role_targets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"roleSlug" varchar(100) NOT NULL,
	"taxonomyVersion" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_role_targets_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "role_skills" ADD CONSTRAINT "role_skills_taxonomyId_role_taxonomies_id_fk" FOREIGN KEY ("taxonomyId") REFERENCES "public"."role_taxonomies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_targets" ADD CONSTRAINT "user_role_targets_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
