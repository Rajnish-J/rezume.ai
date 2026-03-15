import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth/auth";
import { ensureCareerSchemaExists } from "@/src/lib/db/pg/ensure-career-schema";
import { getZodErrorMessage } from "@/src/utils/user/user.util";
import {
  roadmapTaskSchema,
  updateRoadmapTaskBodySchema,
} from "@/src/types/roadmap.types";
import { updateRoadmapTaskForUser } from "@/src/utils/resume/roadmap.util";

type SessionLike = { user?: { id?: string | null } } | null;

function getSessionUserId(session: SessionLike): number | null {
  const rawId = session?.user?.id;
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

type Params = { params: Promise<{ roadmapId: string; taskId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  const userId = getSessionUserId(session);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { roadmapId: roadmapIdRaw, taskId: taskIdRaw } = await params;
  const roadmapId = Number(roadmapIdRaw);
  const taskId = Number(taskIdRaw);

  if (!Number.isInteger(roadmapId) || roadmapId <= 0) {
    return NextResponse.json({ message: "Invalid roadmap id." }, { status: 400 });
  }

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ message: "Invalid task id." }, { status: 400 });
  }

  const body = (await request.json()) as unknown;
  const parsedBody = updateRoadmapTaskBodySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: getZodErrorMessage(parsedBody.error) },
      { status: 400 },
    );
  }

  await ensureCareerSchemaExists();

  try {
    const updatedTask = await updateRoadmapTaskForUser({
      userId,
      roadmapId,
      taskId,
      isCompleted: parsedBody.data.isCompleted,
      notes: parsedBody.data.notes,
    });

    if (!updatedTask) {
      return NextResponse.json({ message: "Task not found." }, { status: 404 });
    }

    return NextResponse.json(roadmapTaskSchema.parse(updatedTask), { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to update roadmap task." },
      { status: 500 },
    );
  }
}
