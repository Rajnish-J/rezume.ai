import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { auth } from "@/src/lib/auth/auth";
import { pgdb } from "@/src/lib/db/pg/db";
import { ensureCareerSchemaExists } from "@/src/lib/db/pg/ensure-career-schema";
import { ensureChatTablesExist } from "@/src/lib/db/pg/ensure-chat-schema";
import {
  resumeChatsTable,
  resumeReadinessReportsTable,
  resumeSkillAssessmentsTable,
  resumeSuggestionsTable,
} from "@/src/lib/db/schema";

type SessionLike = { user?: { id?: string | null } } | null;

function getSessionUserId(session: SessionLike): number | null {
  const rawId = session?.user?.id;
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

type Params = { params: Promise<{ chatId: string }> };

export async function GET(_: Request, { params }: Params) {
  const session = await auth();
  const userId = getSessionUserId(session);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { chatId: chatIdRaw } = await params;
  const chatId = Number(chatIdRaw);
  if (!Number.isInteger(chatId) || chatId <= 0) {
    return NextResponse.json({ message: "Invalid chat id." }, { status: 400 });
  }

  await ensureChatTablesExist();
  await ensureCareerSchemaExists();

  const [thread] = await pgdb
    .select()
    .from(resumeChatsTable)
    .where(and(eq(resumeChatsTable.id, chatId), eq(resumeChatsTable.userId, userId)))
    .limit(1);

  if (!thread) {
    return NextResponse.json({ message: "Chat not found." }, { status: 404 });
  }

  const suggestions = await pgdb
    .select()
    .from(resumeSuggestionsTable)
    .where(eq(resumeSuggestionsTable.resumeId, thread.resumeId))
    .orderBy(desc(resumeSuggestionsTable.createdAt));

  const [report] = await pgdb
    .select()
    .from(resumeReadinessReportsTable)
    .where(
      and(
        eq(resumeReadinessReportsTable.resumeId, thread.resumeId),
        eq(resumeReadinessReportsTable.userId, userId),
      ),
    )
    .orderBy(desc(resumeReadinessReportsTable.createdAt))
    .limit(1);

  const weakSkills = report
    ? await pgdb
        .select()
        .from(resumeSkillAssessmentsTable)
        .where(eq(resumeSkillAssessmentsTable.reportId, report.id))
        .orderBy(desc(resumeSkillAssessmentsTable.weight))
    : [];

  const filteredWeakSkills = weakSkills
    .filter((item) => item.strength !== "strong")
    .slice(0, 6)
    .map((item) => ({
      skillName: item.skillName,
      score: item.score,
      strength: item.strength,
      explanation: item.explanation,
    }));

  return NextResponse.json(
    {
      suggestions: suggestions.slice(0, 6).map((item) => ({
        title: item.suggestionTitle,
        suggestion: item.suggestion,
        priority: item.priority,
      })),
      weakSkills: filteredWeakSkills,
    },
    { status: 200 },
  );
}
