import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import * as r from "@/src/imports/resume.imports";
import {
  evaluateResumeReadiness,
  generateInterviewRoadmap,
  inferProfileLevelFromResume,
} from "@/src/lib/career/scoring/readiness-engine";
import { getRoleTaxonomyBySlug, ensureRoleTaxonomiesPersisted } from "@/src/lib/career/taxonomy";
import { auth } from "@/src/lib/auth/auth";
import { pgdb } from "@/src/lib/db/pg/db";
import { ensureCareerSchemaExists } from "@/src/lib/db/pg/ensure-career-schema";
import { ensureChatTablesExist } from "@/src/lib/db/pg/ensure-chat-schema";
import { ensureResumeStorageColumnsExist } from "@/src/lib/db/pg/ensure-resume-schema";
import { roleSlugSchema } from "@/src/types/career.types";
import {
  resumeChatsTable,
  resumeSuggestionsTable,
  resumesTable,
  userRoleTargetsTable,
  usersTable,
} from "@/src/lib/db/schema";
import {
  fetchLatestReadinessReportForResume,
  saveReadinessReport,
} from "@/src/utils/resume/readiness.util";
import { saveInterviewRoadmap } from "@/src/utils/resume/roadmap.util";

type SessionLike = { user?: { id?: string | null } } | null;

function getSessionUserId(session: SessionLike): number | null {
  const rawId = session?.user?.id;
  const parsed = Number(rawId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function createChatTitle(
  originalFileName: string,
  parsedContext: r.ParsedResumeContext,
): string {
  const role = parsedContext.recommendedRoles[0] ?? "Resume";
  const baseName = originalFileName.replace(/\.[^/.]+$/, "").trim() || "resume";
  return `${role} - ${baseName}`.slice(0, 255);
}

function inferMimeType(file: File): string {
  if (file.type?.trim()) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (lowerName.endsWith(".md") || lowerName.endsWith(".txt")) {
    return "text/plain";
  }

  if (lowerName.endsWith(".doc")) {
    return "application/msword";
  }

  if (lowerName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return "application/octet-stream";
}

export async function GET() {
  const session = await auth();
  const sessionUserId = getSessionUserId(session);

  if (!sessionUserId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await ensureChatTablesExist();
  await ensureResumeStorageColumnsExist();
  await ensureCareerSchemaExists();
  await ensureRoleTaxonomiesPersisted();

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

    const [targetRole] = await pgdb
      .select()
      .from(userRoleTargetsTable)
      .where(eq(userRoleTargetsTable.userId, sessionUserId))
      .limit(1);

    let readinessReport: r.ReadinessReport | undefined;
    let interviewRoadmap: r.InterviewRoadmap | undefined;

    if (targetRole) {
      const parsedRoleSlug = roleSlugSchema.safeParse(targetRole.roleSlug);
      const taxonomy = parsedRoleSlug.success
        ? getRoleTaxonomyBySlug(parsedRoleSlug.data)
        : null;

      if (taxonomy) {
        readinessReport =
          (await fetchLatestReadinessReportForResume({
            resumeId: latestResume.id,
            userId: sessionUserId,
          })) ??
          evaluateResumeReadiness({
            resumeText: latestResume.parsedText,
            taxonomy,
          });

        interviewRoadmap = generateInterviewRoadmap({
          report: readinessReport,
          profileLevel: inferProfileLevelFromResume(latestResume.parsedText),
        });
      }
    }

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
      readinessReport,
      interviewRoadmap,
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
  await ensureCareerSchemaExists();
  await ensureRoleTaxonomiesPersisted();

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
      .where(eq(userRoleTargetsTable.userId, sessionUserId))
      .limit(1);

    if (!targetRole) {
      return NextResponse.json(
        {
          message:
            "Select your target role from Career page before uploading resume.",
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

    if (!parsedRoleSlug.success) {
      return NextResponse.json(
        { message: "Invalid target role. Please select role again from Career." },
        { status: 400 },
      );
    }

    const taxonomy = getRoleTaxonomyBySlug(parsedRoleSlug.data);

    if (!taxonomy) {
      return NextResponse.json(
        { message: "Target role taxonomy not found. Please reselect target role." },
        { status: 400 },
      );
    }

    const parsedContextWithRole = {
      ...parsedContext,
      targetRole: {
        slug: taxonomy.slug,
        name: taxonomy.name,
        version: taxonomy.version,
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
          title: createChatTitle(rawFile.name, parsedContextWithRole),
        })
        .returning();

      chat = { id: savedChat.id, title: savedChat.title };
    } catch {
      chat = null;
    }

    const readinessReport = evaluateResumeReadiness({
      resumeText: parsedText,
      taxonomy,
    });

    await saveReadinessReport({
      resumeId: savedResume.id,
      userId: savedResume.userId,
      report: readinessReport,
    });

    const interviewRoadmap = generateInterviewRoadmap({
      report: readinessReport,
      profileLevel: inferProfileLevelFromResume(parsedText),
    });

    await saveInterviewRoadmap({
      userId: savedResume.userId,
      resumeId: savedResume.id,
      roleSlug: taxonomy.slug,
      roadmap: interviewRoadmap,
    });

    const responseBody = r.resumeUploadResponseSchema.parse({
      resumeId: savedResume.id,
      parsedContext: parsedContextWithRole,
      suggestions: savedSuggestions,
      tokenUsage: aiResult.tokenUsage,
      chatId: chat?.id ?? null,
      chatTitle: chat?.title ?? null,
      readinessReport,
      interviewRoadmap,
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


