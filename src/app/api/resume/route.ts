import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import * as r from "@/src/imports/resume.imports";
import { pgdb } from "@/src/lib/db/pg/db";
import {
  resumeSuggestionsTable,
  resumesTable,
  usersTable,
} from "@/src/lib/db/schema";

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
      .where(eq(resumesTable.userId, parsedQuery.data.userId))
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
          eq(resumeSuggestionsTable.userId, parsedQuery.data.userId),
          eq(resumeSuggestionsTable.resumeId, latestResume.id),
        ),
      );

    const responseBody: r.ResumeInsightsResponse = {
      resumeId: latestResume.id,
      userId: latestResume.userId,
      originalFileName: latestResume.originalFileName,
      parsedContext: r.parsedResumeContextSchema.parse(
        latestResume.parsedContext,
      ),
      suggestions: suggestions.map((item) =>
        r.resumeSuggestionSchema.parse(item),
      ),
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
  try {
    const formData = await request.formData();
    const rawUserId = formData.get("userId");
    const rawFile = formData.get("file");

    const parsedBody = r.uploadResumeBodySchema.safeParse({
      userId: rawUserId,
    });

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: r.getZodErrorMessage(parsedBody.error) },
        { status: 400 },
      );
    }

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
      .where(eq(usersTable.id, parsedBody.data.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const parsedText = await r.extractTextFromFile(rawFile);

    if (!parsedText) {
      return NextResponse.json(
        { message: "Could not parse resume content from file." },
        { status: 400 },
      );
    }

    const parsedContext = r.buildParsedContextFromText(parsedText);
    const safeFileName = r.toSafeFileName(rawFile.name);
    const fileUrl = `uploads/resumes/${Date.now()}_${safeFileName}`;

    const [savedResume] = await pgdb
      .insert(resumesTable)
      .values({
        userId: parsedBody.data.userId,
        originalFileName: rawFile.name,
        fileUrl,
        parsedText,
        parsedContext,
      })
      .returning();

    const aiSuggestions = await r.generateResumeSuggestions({
      parsedContext,
      resumeText: parsedText,
    });

    const validatedSuggestions = z
      .array(r.resumeSuggestionSchema)
      .parse(aiSuggestions);

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

    const responseBody = r.resumeUploadResponseSchema.parse({
      resumeId: savedResume.id,
      userId: savedResume.userId,
      parsedContext,
      suggestions: savedSuggestions,
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
