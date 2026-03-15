import { z } from "zod";

export const roadmapCardSchema = z.object({
  roadmapId: z.number().int().positive(),
  resumeId: z.number().int().positive(),
  roleName: z.string(),
  profileLevel: z.string(),
  estimatedDurationWeeks: z.number().int().positive(),
  completedTasks: z.number().int().nonnegative(),
  totalTasks: z.number().int().nonnegative(),
  chatTitle: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const roadmapTaskSchema = z.object({
  id: z.number().int().positive(),
  taskName: z.string(),
  phase: z.string(),
  focus: z.string(),
  output: z.string(),
  interviewRound: z.string(),
  isCompleted: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const roadmapListResponseSchema = z.object({
  roadmaps: z.array(roadmapCardSchema),
});

export const roadmapDetailResponseSchema = z.object({
  roadmap: roadmapCardSchema,
  tasks: z.array(roadmapTaskSchema),
});

export const updateRoadmapTaskBodySchema = z.object({
  isCompleted: z.boolean().optional(),
  notes: z.string().max(4000).optional(),
});

export type RoadmapCard = z.infer<typeof roadmapCardSchema>;
export type RoadmapTask = z.infer<typeof roadmapTaskSchema>;
export type RoadmapListResponse = z.infer<typeof roadmapListResponseSchema>;
export type RoadmapDetailResponse = z.infer<typeof roadmapDetailResponseSchema>;
export type UpdateRoadmapTaskBody = z.infer<typeof updateRoadmapTaskBodySchema>;
