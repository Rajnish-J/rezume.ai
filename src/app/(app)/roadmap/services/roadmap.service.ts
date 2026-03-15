import {
  roadmapDetailResponseSchema,
  roadmapListResponseSchema,
  roadmapTaskSchema,
  type RoadmapCard,
  type RoadmapDetailResponse,
  type RoadmapTask,
} from "@/src/types/roadmap.types";

function toErrorMessage(payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const value = (payload as { message?: unknown }).message;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return "Something went wrong. Please try again.";
}

export async function fetchRoadmapCards(): Promise<RoadmapCard[]> {
  const response = await fetch("/api/roadmaps", {
    method: "GET",
    cache: "no-store",
  });
  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(toErrorMessage(responseBody));
  }

  return roadmapListResponseSchema.parse(responseBody).roadmaps;
}

export async function fetchRoadmapDetail(
  roadmapId: number,
): Promise<r.RoadmapDetailResponse> {
  const response = await fetch(`/api/roadmaps/${roadmapId}`, {
    method: "GET",
    cache: "no-store",
  });
  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(toErrorMessage(responseBody));
  }

  return roadmapDetailResponseSchema.parse(responseBody);
}

export async function updateRoadmapTask(options: {
  roadmapId: number;
  taskId: number;
  isCompleted?: boolean;
  notes?: string;
}): Promise<RoadmapTask> {
  const response = await fetch(
    `/api/roadmaps/${options.roadmapId}/tasks/${options.taskId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isCompleted: options.isCompleted,
        notes: options.notes,
      }),
    },
  );

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(toErrorMessage(responseBody));
  }

  return roadmapTaskSchema.parse(responseBody);
}
