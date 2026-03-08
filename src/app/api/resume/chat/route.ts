import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import * as r from "@/src/imports/resume.imports";
import { pgdb } from "@/src/lib/db/pg/db";
import { resumeSuggestionsTable, resumesTable } from "@/src/lib/db/schema";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsedPayload = r.resumeChatRequestSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: r.getZodErrorMessage(parsedPayload.error) },
      { status: 400 },
    );
  }

  try {
    const [resume] = await pgdb
      .select()
      .from(resumesTable)
      .where(
        and(
          eq(resumesTable.id, parsedPayload.data.resumeId),
          eq(resumesTable.userId, parsedPayload.data.userId),
        ),
      )
      .limit(1);

    if (!resume) {
      return NextResponse.json(
        { message: "Resume not found." },
        { status: 404 },
      );
    }

    const suggestionRows = await pgdb
      .select()
      .from(resumeSuggestionsTable)
      .where(eq(resumeSuggestionsTable.resumeId, resume.id));

    const parsedContext = r.parsedResumeContextSchema.parse(
      resume.parsedContext,
    );
    const suggestions = suggestionRows.map((item) =>
      r.resumeSuggestionSchema.parse(item),
    );

    const answer = await r.generateResumeChatAnswer({
      parsedContext,
      suggestions,
      userMessage: parsedPayload.data.message,
    });

    const responseBody: r.ResumeChatResponse = {
      answer,
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to generate chat response." },
      { status: 500 },
    );
  }
}
