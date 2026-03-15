import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { generateText, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import * as r from "@/src/imports/resume.imports";
import { auth } from "@/src/lib/auth/auth";
import { pgdb } from "@/src/lib/db/pg/db";
import { ensureChatTablesExist } from "@/src/lib/db/pg/ensure-chat-schema";
import { ensureResumeStorageColumnsExist } from "@/src/lib/db/pg/ensure-resume-schema";
import {
  resumeChatMessagesTable,
  resumeChatsTable,
  resumeSuggestionsTable,
  resumesTable,
} from "@/src/lib/db/schema";
import { createSimpleResumePdfFromText } from "@/src/utils/resume/pdf-builder.util";

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

function extractMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== "object") {
          return "";
        }

        const maybeText = (part as { text?: unknown }).text;
        return typeof maybeText === "string" ? maybeText : "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

function shouldApplyToResume(message: string): boolean {
  const normalized = message.toLowerCase();
  const hasVerb = /(update|rewrite|modify|change|add|remove|improve|delete|fix|edit)/.test(normalized);
  const hasTarget = /(resume|cv|pdf|section|bullet|certification|experience|skills|summary|project)/.test(normalized);

  return hasVerb && hasTarget;
}

async function applyResumeInstruction(options: {
  resumeId: number;
  currentText: string;
  instruction: string;
  assistantReply: string;
}) {
  let updatedText = options.currentText;

  if (process.env.OPENAI_API_KEY) {
    try {
      const rewrite = await generateText({
        model: openai("gpt-4o-mini"),
        system:
          "You are an expert resume writer. Rewrite the resume based on user instruction while preserving factual integrity. Return only the updated plain-text resume.",
        prompt: `Current Resume:\n${options.currentText.slice(0, 14000)}\n\nUser Instruction:\n${options.instruction}\n\nAssistant Guidance:\n${options.assistantReply}`,
      });

      if (rewrite.text.trim()) {
        updatedText = rewrite.text.trim();
      }
    } catch {
      updatedText = `${options.currentText}\n\nUpdated Notes:\n${options.assistantReply}`;
    }
  } else {
    updatedText = `${options.currentText}\n\nUpdated Notes:\n${options.assistantReply}`;
  }

  const parsedContext = r.buildParsedContextFromText(updatedText);
  const pdfBytes = createSimpleResumePdfFromText(updatedText);
  const fileDataBase64 = Buffer.from(pdfBytes).toString("base64");

  await pgdb
    .update(resumesTable)
    .set({
      parsedText: updatedText,
      parsedContext,
      fileMimeType: "application/pdf",
      fileDataBase64,
      updatedAt: new Date(),
    })
    .where(eq(resumesTable.id, options.resumeId));
}

function toTextResponse(text: string): Response {
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
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
  await ensureResumeStorageColumnsExist();

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
    messages?: Array<{ role?: string; content?: unknown }>;
  };

  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const latestUserMessage = [...incomingMessages]
    .reverse()
    .find((message) => message.role === "user" && extractMessageText(message.content));

  const latestUserText = extractMessageText(latestUserMessage?.content);

  if (!latestUserText) {
    return NextResponse.json(
      { message: "A user message is required." },
      { status: 400 },
    );
  }

  await pgdb.insert(resumeChatMessagesTable).values({
    chatId: thread.id,
    role: "user",
    content: latestUserText,
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

  const applyToResume = shouldApplyToResume(latestUserText);

  if (!process.env.OPENAI_API_KEY) {
    const fallback = await r.generateResumeChatAnswer({
      parsedContext,
      suggestions: validatedSuggestions,
      userMessage: latestUserText,
    });

    console.info("[chat-fallback-token-usage]", fallback.tokenUsage);

    await pgdb.insert(resumeChatMessagesTable).values({
      chatId: thread.id,
      role: "assistant",
      content: fallback.answer,
    });

    if (applyToResume) {
      await applyResumeInstruction({
        resumeId: resume.id,
        currentText: resume.parsedText,
        instruction: latestUserText,
        assistantReply: fallback.answer,
      });
    }

    await pgdb
      .update(resumeChatsTable)
      .set({ updatedAt: new Date() })
      .where(eq(resumeChatsTable.id, thread.id));

    return toTextResponse(fallback.answer);
  }

  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: r.resumeChatSystemPrompt,
      prompt: `Resume Context: ${JSON.stringify(parsedContext)}\nSuggestions: ${JSON.stringify(validatedSuggestions)}\nChat History:\n${historyPrompt}\n\nLatest User Message:\n${latestUserText}`,
      onFinish: async ({ text, usage }) => {
        if (!text?.trim()) {
          return;
        }

        console.info("[chat-stream-token-usage]", usage);

        await pgdb.insert(resumeChatMessagesTable).values({
          chatId: thread.id,
          role: "assistant",
          content: text,
        });

        if (applyToResume) {
          await applyResumeInstruction({
            resumeId: resume.id,
            currentText: resume.parsedText,
            instruction: latestUserText,
            assistantReply: text,
          });
        }

        await pgdb
          .update(resumeChatsTable)
          .set({ updatedAt: new Date() })
          .where(eq(resumeChatsTable.id, thread.id));
      },
      onError: (error) => {
        console.error("[chat-stream-error]", error);
        return "I hit an issue generating the response. Please try once more.";
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[chat-route-catch]", error);

    const fallback = await r.generateResumeChatAnswer({
      parsedContext,
      suggestions: validatedSuggestions,
      userMessage: latestUserText,
    });

    console.info("[chat-catch-fallback-token-usage]", fallback.tokenUsage);

    await pgdb.insert(resumeChatMessagesTable).values({
      chatId: thread.id,
      role: "assistant",
      content: fallback.answer,
    });

    if (applyToResume) {
      await applyResumeInstruction({
        resumeId: resume.id,
        currentText: resume.parsedText,
        instruction: latestUserText,
        assistantReply: fallback.answer,
      });
    }

    await pgdb
      .update(resumeChatsTable)
      .set({ updatedAt: new Date() })
      .where(eq(resumeChatsTable.id, thread.id));

    return toTextResponse(fallback.answer);
  }
}
