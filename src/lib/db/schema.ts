import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
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
