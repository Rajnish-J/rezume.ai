import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import * as r from "@/src/imports/resume.imports";
import { auth } from "@/src/lib/auth/auth";
import { pgdb } from "@/src/lib/db/pg/db";
import { ensureChatTablesExist } from "@/src/lib/db/pg/ensure-chat-schema";
import {
  resumeChatMessagesTable,
  resumeChatsTable,
  resumeSuggestionsTable,
  resumesTable,
} from "@/src/lib/db/schema";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getSessionUserId(session: Awaited<ReturnType<typeof auth>>): number | null {
  const rawId = session?.user?.id;
  const parsed = Number(rawId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function POST(
  request: Request,
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

  const body = (await request.json()) as {
    messages?: Array<{ role?: string; content?: string }>;
  };

  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const latestUserMessage = [...incomingMessages]
    .reverse()
    .find((message) => message.role === "user" && message.content?.trim());

  if (!latestUserMessage?.content) {
    return NextResponse.json(
      { message: "A user message is required." },
      { status: 400 },
    );
  }

  await pgdb.insert(resumeChatMessagesTable).values({
    chatId: thread.id,
    role: "user",
    content: latestUserMessage.content,
  });

  await pgdb
    .update(resumeChatsTable)
    .set({ updatedAt: new Date() })
    .where(eq(resumeChatsTable.id, thread.id));

  const [resume] = await pgdb
    .select()
    .from(resumesTable)
    .where(
      and(
        eq(resumesTable.id, thread.resumeId),
        eq(resumesTable.userId, sessionUserId),
      ),
    )
    .limit(1);

  if (!resume) {
    return NextResponse.json({ message: "Resume not found." }, { status: 404 });
  }

  const suggestions = await pgdb
    .select()
    .from(resumeSuggestionsTable)
    .where(eq(resumeSuggestionsTable.resumeId, resume.id));

  const historyRows = await pgdb
    .select()
    .from(resumeChatMessagesTable)
    .where(eq(resumeChatMessagesTable.chatId, thread.id))
    .orderBy(asc(resumeChatMessagesTable.createdAt));

  const parsedContext = r.parsedResumeContextSchema.parse(resume.parsedContext);
  const validatedSuggestions = suggestions.map((item) =>
    r.resumeSuggestionSchema.parse(item),
  );

  const historyPrompt = historyRows
    .slice(-20)
    .map((row) => `${row.role === "user" ? "User" : "Assistant"}: ${row.content}`)
    .join("\n");

  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: r.resumeChatSystemPrompt,
      prompt: `Resume Context: ${JSON.stringify(parsedContext)}\nSuggestions: ${JSON.stringify(validatedSuggestions)}\nChat History:\n${historyPrompt}`,
      onFinish: async ({ text }) => {
        if (!text?.trim()) {
          return;
        }

        await pgdb.insert(resumeChatMessagesTable).values({
          chatId: thread.id,
          role: "assistant",
          content: text,
        });

        await pgdb
          .update(resumeChatsTable)
          .set({ updatedAt: new Date() })
          .where(eq(resumeChatsTable.id, thread.id));
      },
    });

    return result.toDataStreamResponse();
  } catch {
    return NextResponse.json(
      { message: "Failed to generate chat response." },
      { status: 500 },
    );
  }
}
