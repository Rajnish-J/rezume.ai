import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { auth } from "@/src/lib/auth/auth";
import { pgdb } from "@/src/lib/db/pg/db";
import { ensureChatTablesExist } from "@/src/lib/db/pg/ensure-chat-schema";
import { ensureResumeStorageColumnsExist } from "@/src/lib/db/pg/ensure-resume-schema";
import { resumeChatsTable, resumesTable } from "@/src/lib/db/schema";

function getSessionUserId(session: Awaited<ReturnType<typeof auth>>): number | null {
  const rawId = session?.user?.id;
  const parsed = Number(rawId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function toAttachmentFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "resume.pdf";
}

async function loadResumeFileForChat(chatIdRaw: string) {
  const chatId = Number(chatIdRaw);

  if (!Number.isInteger(chatId) || chatId <= 0) {
    return { error: NextResponse.json({ message: "Invalid chat id." }, { status: 400 }) };
  }

  const session = await auth();
  const sessionUserId = getSessionUserId(session);

  if (!sessionUserId) {
    return { error: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  }

  await ensureChatTablesExist();
  await ensureResumeStorageColumnsExist();

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
    return { error: NextResponse.json({ message: "Chat not found." }, { status: 404 }) };
  }

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
    return { error: NextResponse.json({ message: "Resume not found." }, { status: 404 }) };
  }

  if (!resume.fileDataBase64) {
    return {
      error: NextResponse.json(
        {
          message:
            "No stored file data was found for this resume. Re-upload the resume once to enable PDF rendering.",
        },
        { status: 404 },
      ),
    };
  }

  const mimeType = resume.fileMimeType || "application/pdf";

  return {
    data: {
      bytes: Buffer.from(resume.fileDataBase64, "base64"),
      fileName: toAttachmentFileName(resume.originalFileName),
      mimeType,
    },
  };
}

export async function HEAD(
  _request: Request,
  context: { params: Promise<{ chatId: string }> },
) {
  const params = await context.params;
  const loaded = await loadResumeFileForChat(params.chatId);

  if (loaded.error) {
    return loaded.error;
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": loaded.data.mimeType,
      "Content-Disposition": `inline; filename="${loaded.data.fileName}"`,
      "X-Resume-File-Name": loaded.data.fileName,
      "X-Resume-Mime-Type": loaded.data.mimeType,
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ chatId: string }> },
) {
  const params = await context.params;
  const loaded = await loadResumeFileForChat(params.chatId);

  if (loaded.error) {
    return loaded.error;
  }

  const url = new URL(request.url);
  const shouldDownload = url.searchParams.get("download") === "1";

  return new NextResponse(loaded.data.bytes, {
    status: 200,
    headers: {
      "Content-Type": loaded.data.mimeType,
      "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${loaded.data.fileName}"`,
      "Cache-Control": "private, max-age=120",
    },
  });
}

