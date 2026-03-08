import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { auth } from "@/src/lib/auth/auth";
import { pgdb } from "@/src/lib/db/pg/db";
import { ensureChatTablesExist } from "@/src/lib/db/pg/ensure-chat-schema";
import { resumeChatsTable, resumesTable } from "@/src/lib/db/schema";

function getSessionUserId(session: Awaited<ReturnType<typeof auth>>): number | null {
  const rawId = session?.user?.id;
  const parsed = Number(rawId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET() {
  const session = await auth();
  const sessionUserId = getSessionUserId(session);

  if (!sessionUserId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await ensureChatTablesExist();

  const threads = await pgdb
    .select()
    .from(resumeChatsTable)
    .where(eq(resumeChatsTable.userId, sessionUserId))
    .orderBy(desc(resumeChatsTable.updatedAt));

  return NextResponse.json(
    {
      threads: threads.map((thread) => ({
        id: thread.id,
        resumeId: thread.resumeId,
        title: thread.title,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
      })),
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  const sessionUserId = getSessionUserId(session);

  if (!sessionUserId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await ensureChatTablesExist();

  const payload = (await request.json()) as { resumeId?: number; title?: string };

  if (!payload.resumeId || payload.resumeId <= 0) {
    return NextResponse.json(
      { message: "A valid resumeId is required." },
      { status: 400 },
    );
  }

  const [resume] = await pgdb
    .select()
    .from(resumesTable)
    .where(
      and(
        eq(resumesTable.id, payload.resumeId),
        eq(resumesTable.userId, sessionUserId),
      ),
    )
    .limit(1);

  if (!resume) {
    return NextResponse.json({ message: "Resume not found." }, { status: 404 });
  }

  const [thread] = await pgdb
    .insert(resumeChatsTable)
    .values({
      userId: sessionUserId,
      resumeId: resume.id,
      title: payload.title?.trim() || `Resume Chat ${resume.id}`,
    })
    .returning();

  return NextResponse.json(
    {
      id: thread.id,
      resumeId: thread.resumeId,
      title: thread.title,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}
