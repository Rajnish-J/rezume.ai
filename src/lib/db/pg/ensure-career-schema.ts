import { sql } from "drizzle-orm";

import { pgdb } from "@/src/lib/db/pg/db";

let ensuredCareerSchema = false;

export async function ensureCareerSchemaExists(): Promise<void> {
  if (ensuredCareerSchema) {
    return;
  }

  await pgdb.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'skill_category'
      ) THEN
        CREATE TYPE "skill_category" AS ENUM ('core', 'production', 'professional');
      END IF;
    END
    $$;
  `);

  await pgdb.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'skill_strength'
      ) THEN
        CREATE TYPE "skill_strength" AS ENUM ('missing', 'weak', 'strong');
      END IF;
    END
    $$;
  `);

  await pgdb.execute(sql`
    CREATE TABLE IF NOT EXISTS "role_taxonomies" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "slug" varchar(100) NOT NULL,
      "name" varchar(150) NOT NULL,
      "description" text NOT NULL,
      "version" integer NOT NULL,
      "isActive" boolean DEFAULT true NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await pgdb.execute(sql`
    CREATE TABLE IF NOT EXISTS "role_skills" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "taxonomyId" integer NOT NULL,
      "skillKey" varchar(100) NOT NULL,
      "skillName" varchar(150) NOT NULL,
      "category" "skill_category" NOT NULL,
      "weight" integer NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await pgdb.execute(sql`
    CREATE TABLE IF NOT EXISTS "user_role_targets" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "userId" integer NOT NULL,
      "roleSlug" varchar(100) NOT NULL,
      "taxonomyVersion" integer NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await pgdb.execute(sql`
    CREATE TABLE IF NOT EXISTS "resume_readiness_reports" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "resumeId" integer NOT NULL,
      "userId" integer NOT NULL,
      "roleSlug" varchar(100) NOT NULL,
      "roleName" varchar(150) NOT NULL,
      "taxonomyVersion" integer NOT NULL,
      "readinessScore" integer NOT NULL,
      "coverageCore" integer NOT NULL,
      "coverageProduction" integer NOT NULL,
      "coverageProfessional" integer NOT NULL,
      "summary" text NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await pgdb.execute(sql`
    CREATE TABLE IF NOT EXISTS "resume_skill_assessments" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "reportId" integer NOT NULL,
      "skillKey" varchar(100) NOT NULL,
      "skillName" varchar(150) NOT NULL,
      "category" "skill_category" NOT NULL,
      "weight" integer NOT NULL,
      "claimed" boolean NOT NULL,
      "projectProven" boolean NOT NULL,
      "experienceProven" boolean NOT NULL,
      "score" integer NOT NULL,
      "strength" "skill_strength" NOT NULL,
      "explanation" text NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await pgdb.execute(sql`
    CREATE TABLE IF NOT EXISTS "interview_roadmaps" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "userId" integer NOT NULL,
      "resumeId" integer NOT NULL,
      "roleSlug" varchar(100) NOT NULL,
      "roleName" varchar(150) NOT NULL,
      "profileLevel" varchar(50) NOT NULL,
      "estimatedDurationWeeks" integer NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await pgdb.execute(sql`
    CREATE TABLE IF NOT EXISTS "roadmap_tasks" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "roadmapId" integer NOT NULL,
      "taskName" varchar(255) NOT NULL,
      "phase" varchar(100) NOT NULL,
      "focus" text NOT NULL,
      "output" text NOT NULL,
      "interviewRound" varchar(100) NOT NULL,
      "isCompleted" boolean DEFAULT false NOT NULL,
      "notes" text,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  ensuredCareerSchema = true;
}
