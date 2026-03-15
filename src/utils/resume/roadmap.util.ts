import { and, desc, eq, sql } from "drizzle-orm";

import { pgdb } from "@/src/lib/db/pg/db";
import {
  interviewRoadmapsTable,
  roadmapTasksTable,
  resumeChatsTable,
} from "@/src/lib/db/schema";
import { InterviewRoadmap } from "@/src/types/resume.types";
import {
  RoadmapCard,
  RoadmapDetailResponse,
  RoadmapTask,
} from "@/src/types/roadmap.types";

export async function saveInterviewRoadmap(options: {
  userId: number;
  resumeId: number;
  roleSlug: string;
  roadmap: InterviewRoadmap;
}): Promise<number> {
  const [roadmap] = await pgdb
    .insert(interviewRoadmapsTable)
    .values({
      userId: options.userId,
      resumeId: options.resumeId,
      roleSlug: options.roleSlug,
      roleName: options.roadmap.targetRole,
      profileLevel: options.roadmap.profileLevel,
      estimatedDurationWeeks: options.roadmap.estimatedDurationWeeks,
    })
    .returning();

  await pgdb.insert(roadmapTasksTable).values(
    options.roadmap.steps.map((step, index) => ({
      roadmapId: roadmap.id,
      taskName: `${step.phase} (${index + 1})`,
      phase: step.phase,
      focus: step.focus,
      output: step.output,
      interviewRound: step.interviewRound,
      isCompleted: false,
      notes: null,
    })),
  );

  return roadmap.id;
}

export async function listRoadmapsForUser(userId: number): Promise<RoadmapCard[]> {
  const roadmaps = await pgdb
    .select({
      roadmapId: interviewRoadmapsTable.id,
      resumeId: interviewRoadmapsTable.resumeId,
      roleName: interviewRoadmapsTable.roleName,
      profileLevel: interviewRoadmapsTable.profileLevel,
      estimatedDurationWeeks: interviewRoadmapsTable.estimatedDurationWeeks,
      createdAt: interviewRoadmapsTable.createdAt,
      updatedAt: interviewRoadmapsTable.updatedAt,
    })
    .from(interviewRoadmapsTable)
    .where(eq(interviewRoadmapsTable.userId, userId))
    .orderBy(desc(interviewRoadmapsTable.updatedAt));

  const chats = await pgdb
    .select({
      resumeId: resumeChatsTable.resumeId,
      title: resumeChatsTable.title,
      updatedAt: resumeChatsTable.updatedAt,
    })
    .from(resumeChatsTable)
    .where(eq(resumeChatsTable.userId, userId))
    .orderBy(desc(resumeChatsTable.updatedAt));

  const latestChatTitleByResume = new Map<number, string>();
  for (const chat of chats) {
    if (!latestChatTitleByResume.has(chat.resumeId)) {
      latestChatTitleByResume.set(chat.resumeId, chat.title);
    }
  }

  const taskStats = await pgdb
    .select({
      roadmapId: roadmapTasksTable.roadmapId,
      totalTasks: sql<number>`count(*)::int`,
      completedTasks:
        sql<number>`sum(case when "roadmap_tasks"."isCompleted" then 1 else 0 end)::int`,
    })
    .from(roadmapTasksTable)
    .groupBy(roadmapTasksTable.roadmapId);

  const statMap = new Map(taskStats.map((item) => [item.roadmapId, item]));

  return roadmaps.map((item) => {
    const stats = statMap.get(item.roadmapId);
    return {
      roadmapId: item.roadmapId,
      resumeId: item.resumeId,
      roleName: item.roleName,
      profileLevel: item.profileLevel,
      estimatedDurationWeeks: item.estimatedDurationWeeks,
      completedTasks: stats?.completedTasks ?? 0,
      totalTasks: stats?.totalTasks ?? 0,
      chatTitle: latestChatTitleByResume.get(item.resumeId) ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  });
}

export async function getRoadmapDetailForUser(options: {
  userId: number;
  roadmapId: number;
}): Promise<RoadmapDetailResponse | null> {
  const roadmaps = await listRoadmapsForUser(options.userId);
  const roadmap = roadmaps.find((item) => item.roadmapId === options.roadmapId);

  if (!roadmap) {
    return null;
  }

  const tasks = await pgdb
    .select()
    .from(roadmapTasksTable)
    .where(eq(roadmapTasksTable.roadmapId, options.roadmapId))
    .orderBy(desc(roadmapTasksTable.createdAt));

  return {
    roadmap,
    tasks: tasks.map(
      (task): RoadmapTask => ({
        id: task.id,
        taskName: task.taskName,
        phase: task.phase,
        focus: task.focus,
        output: task.output,
        interviewRound: task.interviewRound,
        isCompleted: task.isCompleted,
        notes: task.notes ?? null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }),
    ),
  };
}

export async function updateRoadmapTaskForUser(options: {
  userId: number;
  roadmapId: number;
  taskId: number;
  isCompleted?: boolean;
  notes?: string;
}): Promise<RoadmapTask | null> {
  const detail = await getRoadmapDetailForUser({
    userId: options.userId,
    roadmapId: options.roadmapId,
  });

  if (!detail || !detail.tasks.find((item) => item.id === options.taskId)) {
    return null;
  }

  const updateData: {
    isCompleted?: boolean;
    notes?: string;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (typeof options.isCompleted === "boolean") {
    updateData.isCompleted = options.isCompleted;
  }

  if (typeof options.notes === "string") {
    updateData.notes = options.notes;
  }

  const [updated] = await pgdb
    .update(roadmapTasksTable)
    .set(updateData)
    .where(
      and(
        eq(roadmapTasksTable.id, options.taskId),
        eq(roadmapTasksTable.roadmapId, options.roadmapId),
      ),
    )
    .returning();

  await pgdb
    .update(interviewRoadmapsTable)
    .set({ updatedAt: new Date() })
    .where(eq(interviewRoadmapsTable.id, options.roadmapId));

  if (!updated) {
    return null;
  }

  return {
    id: updated.id,
    taskName: updated.taskName,
    phase: updated.phase,
    focus: updated.focus,
    output: updated.output,
    interviewRound: updated.interviewRound,
    isCompleted: updated.isCompleted,
    notes: updated.notes ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}
