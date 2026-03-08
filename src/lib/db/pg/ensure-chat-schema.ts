import { sql } from "drizzle-orm";

import { pgdb } from "@/src/lib/db/pg/db";

let ensured = false;

export async function ensureChatTablesExist(): Promise<void> {
  if (ensured) {
    return;
  }

  await pgdb.execute(sql`
    CREATE TABLE IF NOT EXISTS "resume_chats" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "userId" integer NOT NULL,
      "resumeId" integer NOT NULL,
      "title" varchar(255) NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await pgdb.execute(sql`
    CREATE TABLE IF NOT EXISTS "resume_chat_messages" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "chatId" integer NOT NULL,
      "role" varchar(20) NOT NULL,
      "content" text NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  ensured = true;
}
