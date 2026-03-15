import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth/auth";
import { ensureCareerSchemaExists } from "@/src/lib/db/pg/ensure-career-schema";
import { roadmapDetailResponseSchema } from "@/src/types/roadmap.types";
import { getRoadmapDetailForUser } from "@/src/utils/resume/roadmap.util";

type SessionLike = { user?: { id?: string | null } } | null;

function getSessionUserId(session: SessionLike): number | null {
  const rawId = session?.user?.id;
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

type Params = { params: Promise<{ roadmapId: string }> };

export async function GET(_: Request, { params }: Params) {
  const session = await auth();
  const userId = getSessionUserId(session);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { roadmapId: roadmapIdRaw } = await params;
  const roadmapId = Number(roadmapIdRaw);

  if (!Number.isInteger(roadmapId) || roadmapId <= 0) {
    return NextResponse.json({ message: "Invalid roadmap id." }, { status: 400 });
  }

  await ensureCareerSchemaExists();

  try {
    const detail = await getRoadmapDetailForUser({ userId, roadmapId });
    if (!detail) {
      return NextResponse.json({ message: "Roadmap not found." }, { status: 404 });
    }

    const responseBody = roadmapDetailResponseSchema.parse(detail);
    return NextResponse.json(responseBody, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch roadmap detail." },
      { status: 500 },
    );
  }
}
