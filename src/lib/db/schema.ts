import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 100 }).unique(),
  passwordHash: text(),
  authProvider: varchar({ length: 50 }).notNull().default("credentials"),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const resumesTable = pgTable("resumes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  originalFileName: varchar({ length: 255 }).notNull(),
  fileUrl: text().notNull(),
  fileMimeType: varchar({ length: 120 }),
  fileDataBase64: text(),
  parsedText: text().notNull(),
  parsedContext: jsonb().$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const resumeSuggestionsTable = pgTable("resume_suggestions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  resumeId: integer()
    .notNull()
    .references(() => resumesTable.id, { onDelete: "cascade" }),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  suggestionTitle: varchar({ length: 255 }).notNull(),
  suggestion: text().notNull(),
  category: varchar({ length: 100 }).notNull(),
  priority: varchar({ length: 20 }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const skillCategoryEnum = pgEnum("skill_category", [
  "core",
  "production",
  "professional",
]);

export const skillStrengthEnum = pgEnum("skill_strength", [
  "missing",
  "weak",
  "strong",
]);

export const roleTaxonomiesTable = pgTable(
  "role_taxonomies",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    slug: varchar({ length: 100 }).notNull(),
    name: varchar({ length: 150 }).notNull(),
    description: text().notNull(),
    version: integer().notNull(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.slug, table.version)],
);

export const roleSkillsTable = pgTable(
  "role_skills",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    taxonomyId: integer()
      .notNull()
      .references(() => roleTaxonomiesTable.id, { onDelete: "cascade" }),
    skillKey: varchar({ length: 100 }).notNull(),
    skillName: varchar({ length: 150 }).notNull(),
    category: skillCategoryEnum().notNull(),
    weight: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.taxonomyId, table.skillKey)],
);

export const userRoleTargetsTable = pgTable(
  "user_role_targets",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    roleSlug: varchar({ length: 100 }).notNull(),
    taxonomyVersion: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.userId)],
);

export const resumeReadinessReportsTable = pgTable("resume_readiness_reports", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  resumeId: integer()
    .notNull()
    .references(() => resumesTable.id, { onDelete: "cascade" }),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  roleSlug: varchar({ length: 100 }).notNull(),
  roleName: varchar({ length: 150 }).notNull(),
  taxonomyVersion: integer().notNull(),
  readinessScore: integer().notNull(),
  coverageCore: integer().notNull(),
  coverageProduction: integer().notNull(),
  coverageProfessional: integer().notNull(),
  summary: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const resumeSkillAssessmentsTable = pgTable(
  "resume_skill_assessments",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    reportId: integer()
      .notNull()
      .references(() => resumeReadinessReportsTable.id, { onDelete: "cascade" }),
    skillKey: varchar({ length: 100 }).notNull(),
    skillName: varchar({ length: 150 }).notNull(),
    category: skillCategoryEnum().notNull(),
    weight: integer().notNull(),
    claimed: boolean().notNull(),
    projectProven: boolean().notNull(),
    experienceProven: boolean().notNull(),
    score: integer().notNull(),
    strength: skillStrengthEnum().notNull(),
    explanation: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.reportId, table.skillKey)],
);

export const interviewRoadmapsTable = pgTable("interview_roadmaps", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  resumeId: integer()
    .notNull()
    .references(() => resumesTable.id, { onDelete: "cascade" }),
  roleSlug: varchar({ length: 100 }).notNull(),
  roleName: varchar({ length: 150 }).notNull(),
  profileLevel: varchar({ length: 50 }).notNull(),
  estimatedDurationWeeks: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const roadmapTasksTable = pgTable(
  "roadmap_tasks",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    roadmapId: integer()
      .notNull()
      .references(() => interviewRoadmapsTable.id, { onDelete: "cascade" }),
    taskName: varchar({ length: 255 }).notNull(),
    phase: varchar({ length: 100 }).notNull(),
    focus: text().notNull(),
    output: text().notNull(),
    interviewRound: varchar({ length: 100 }).notNull(),
    isCompleted: boolean().notNull().default(false),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.roadmapId, table.taskName)],
);

export const resumeChatsTable = pgTable("resume_chats", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  resumeId: integer()
    .notNull()
    .references(() => resumesTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const resumeChatMessagesTable = pgTable("resume_chat_messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  chatId: integer()
    .notNull()
    .references(() => resumeChatsTable.id, { onDelete: "cascade" }),
  role: varchar({ length: 20 }).notNull(),
  content: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
