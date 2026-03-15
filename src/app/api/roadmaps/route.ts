import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth/auth";
import { ensureCareerSchemaExists } from "@/src/lib/db/pg/ensure-career-schema";
import { roadmapListResponseSchema } from "@/src/types/roadmap.types";
import { listRoadmapsForUser } from "@/src/utils/resume/roadmap.util";

type SessionLike = { user?: { id?: string | null } } | null;

function getSessionUserId(session: SessionLike): number | null {
  const rawId = session?.user?.id;
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET() {
  const session = await auth();
  const userId = getSessionUserId(session);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await ensureCareerSchemaExists();

  try {
    const roadmaps = await listRoadmapsForUser(userId);
    const responseBody = roadmapListResponseSchema.parse({ roadmaps });
    return NextResponse.json(responseBody, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch roadmaps." },
      { status: 500 },
    );
  }
}
