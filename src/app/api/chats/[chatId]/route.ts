import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { auth } from "@/src/lib/auth/auth";
import { pgdb } from "@/src/lib/db/pg/db";
import { ensureChatTablesExist } from "@/src/lib/db/pg/ensure-chat-schema";
import { resumeChatMessagesTable, resumeChatsTable } from "@/src/lib/db/schema";

function getSessionUserId(session: Awaited<ReturnType<typeof auth>>): number | null {
  const rawId = session?.user?.id;
  const parsed = Number(rawId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ chatId: string }> },
) {
  const session = await auth();
  const sessionUserId = getSessionUserId(session);

  if (!sessionUserId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await ensureChatTablesExist();

  const params = await context.params;
  const chatId = Number(params.chatId);

  if (!Number.isInteger(chatId) || chatId <= 0) {
    return NextResponse.json({ message: "Invalid chat id." }, { status: 400 });
  }

  const [thread] = await pgdb
    .select()
    .from(resumeChatsTable)
    .where(
      and(
        eq(resumeChatsTable.id, chatId),
        eq(resumeChatsTable.userId, sessionUserId),
      ),
    )
    .limit(1);

  if (!thread) {
    return NextResponse.json({ message: "Chat not found." }, { status: 404 });
  }

  const messages = await pgdb
    .select()
    .from(resumeChatMessagesTable)
    .where(eq(resumeChatMessagesTable.chatId, thread.id))
    .orderBy(asc(resumeChatMessagesTable.createdAt));

  return NextResponse.json(
    {
      thread: {
        id: thread.id,
        resumeId: thread.resumeId,
        title: thread.title,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
      },
      messages: messages.map((message) => ({
        id: message.id,
        chatId: message.chatId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
    },
    { status: 200 },
  );
}
