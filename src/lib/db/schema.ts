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
