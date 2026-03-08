import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import * as a from "@/src/lib/ai/resume/resume-ai";
import { pgdb } from "@/src/lib/db/pg/db";
import { resumeSuggestionsTable, resumesTable } from "@/src/lib/db/schema";
import * as t from "@/src/types/resume.types";
import * as u from "@/src/utils/resume/resume.util";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsedPayload = t.resumeChatRequestSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: u.getZodErrorMessage(parsedPayload.error) },
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
      return NextResponse.json({ message: "Resume not found." }, { status: 404 });
    }

    const suggestionRows = await pgdb
      .select()
      .from(resumeSuggestionsTable)
      .where(eq(resumeSuggestionsTable.resumeId, resume.id));

    const parsedContext = t.parsedResumeContextSchema.parse(resume.parsedContext);
    const suggestions = suggestionRows.map((item) =>
      t.resumeSuggestionSchema.parse(item),
    );

    const answer = await a.generateResumeChatAnswer({
      parsedContext,
      suggestions,
      userMessage: parsedPayload.data.message,
    });

    const responseBody: t.ResumeChatResponse = {
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
