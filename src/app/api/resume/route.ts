import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import * as r from "@/src/imports/resume.imports";
import { auth } from "@/src/lib/auth/auth";
import { pgdb } from "@/src/lib/db/pg/db";
import { ensureChatTablesExist } from "@/src/lib/db/pg/ensure-chat-schema";
import { ensureResumeStorageColumnsExist } from "@/src/lib/db/pg/ensure-resume-schema";
import {
  resumeChatsTable,
  resumeSuggestionsTable,
  resumesTable,
  usersTable,
} from "@/src/lib/db/schema";
import { getRoleTaxonomyBySlug } from "@/src/lib/career/taxonomy";
import { roleSlugSchema } from "@/src/types/career.types";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const parsedQuery = r.userIdQuerySchema.safeParse({
    userId: requestUrl.searchParams.get("userId"),
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { message: r.getZodErrorMessage(parsedQuery.error) },
      { status: 400 },
    );
  }

  try {
    const [latestResume] = await pgdb
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, sessionUserId))
      .orderBy(desc(resumesTable.createdAt))
      .limit(1);

    if (!latestResume) {
      return NextResponse.json(
        { message: "No resume found for this user." },
        { status: 404 },
      );
    }

    const suggestions = await pgdb
      .select()
      .from(resumeSuggestionsTable)
      .where(
        and(
          eq(resumeSuggestionsTable.userId, sessionUserId),
          eq(resumeSuggestionsTable.resumeId, latestResume.id),
        ),
      );

    const [latestChat] = await pgdb
      .select()
      .from(resumeChatsTable)
      .where(
        and(
          eq(resumeChatsTable.userId, sessionUserId),
          eq(resumeChatsTable.resumeId, latestResume.id),
        ),
      )
      .orderBy(desc(resumeChatsTable.updatedAt))
      .limit(1);

    const responseBody: r.ResumeInsightsResponse = {
      resumeId: latestResume.id,
      originalFileName: latestResume.originalFileName,
      parsedContext: r.parsedResumeContextSchema.parse(
        latestResume.parsedContext,
      ),
      suggestions: suggestions.map((item) =>
        r.resumeSuggestionSchema.parse(item),
      ),
      latestChatId: latestChat?.id ?? null,
      latestChatTitle: latestChat?.title ?? null,
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch resume insights." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const sessionUserId = getSessionUserId(session);

  if (!sessionUserId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await ensureChatTablesExist();
  await ensureResumeStorageColumnsExist();

  try {
    const formData = await request.formData();
    const rawFile = formData.get("file");

    if (!(rawFile instanceof File)) {
      return NextResponse.json(
        { message: "A resume file is required." },
        { status: 400 },
      );
    }

    const fileValidationError = r.validateResumeFile(rawFile);

    if (fileValidationError) {
      return NextResponse.json(
        { message: fileValidationError },
        { status: 400 },
      );
    }

    const [user] = await pgdb
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, sessionUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const [targetRole] = await pgdb
      .select()
      .from(userRoleTargetsTable)
      .where(eq(userRoleTargetsTable.userId, parsedBody.data.userId))
      .limit(1);

    if (!targetRole) {
      return NextResponse.json(
        {
          message:
            "Select a target role from Career page before uploading resume.",
        },
        { status: 400 },
      );
    }

    const parsedText = await r.extractTextFromFile(rawFile);

    if (!parsedText) {
      return NextResponse.json(
        { message: "Could not parse resume content from file." },
        { status: 400 },
      );
    }

    const fileBase64 = Buffer.from(await rawFile.arrayBuffer()).toString("base64");
    const parsedContext = r.buildParsedContextFromText(parsedText);
    const parsedRoleSlug = roleSlugSchema.safeParse(targetRole.roleSlug);
    const taxonomy = parsedRoleSlug.success
      ? getRoleTaxonomyBySlug(parsedRoleSlug.data)
      : null;
    const parsedContextWithRole = {
      ...parsedContext,
      targetRole: {
        slug: targetRole.roleSlug,
        name: taxonomy?.name ?? targetRole.roleSlug,
        version: targetRole.taxonomyVersion,
      },
    };
    const safeFileName = r.toSafeFileName(rawFile.name);
    const fileUrl = `db://resumes/${Date.now()}_${safeFileName}`;

    const [savedResume] = await pgdb
      .insert(resumesTable)
      .values({
        userId: sessionUserId,
        originalFileName: rawFile.name,
        fileUrl,
        fileMimeType: inferMimeType(rawFile),
        fileDataBase64: fileBase64,
        parsedText,
        parsedContext: parsedContextWithRole,
      })
      .returning();

    const aiResult = await r.generateResumeSuggestions({
      parsedContext: parsedContextWithRole,
      resumeText: parsedText,
    });

    const validatedSuggestions = z
      .array(r.resumeSuggestionSchema)
      .parse(aiResult.suggestions);

    const savedSuggestions = await pgdb
      .insert(resumeSuggestionsTable)
      .values(
        validatedSuggestions.map((item) => ({
          resumeId: savedResume.id,
          userId: savedResume.userId,
          suggestionTitle: item.suggestionTitle,
          suggestion: item.suggestion,
          category: item.category,
          priority: item.priority,
        })),
      )
      .returning();

    let chat: { id: number; title: string } | null = null;

    try {
      const [savedChat] = await pgdb
        .insert(resumeChatsTable)
        .values({
          userId: savedResume.userId,
          resumeId: savedResume.id,
          title: createChatTitle(rawFile.name, parsedContext),
        })
        .returning();

      chat = { id: savedChat.id, title: savedChat.title };
    } catch {
      chat = null;
    }

    const responseBody = r.resumeUploadResponseSchema.parse({
      resumeId: savedResume.id,
      userId: savedResume.userId,
      parsedContext: parsedContextWithRole,
      suggestions: savedSuggestions,
      tokenUsage: aiResult.tokenUsage,
      chatId: chat?.id ?? null,
      chatTitle: chat?.title ?? null,
    });

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: r.getZodErrorMessage(error) },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Failed to upload and process resume." },
      { status: 500 },
    );
  }
}


