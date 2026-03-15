import { z } from "zod";

export const chatThreadSchema = z.object({
  id: z.number().int().positive(),
  resumeId: z.number().int().positive(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const chatMessageSchema = z.object({
  id: z.number().int().positive(),
  chatId: z.number().int().positive(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.string(),
});

export const chatThreadsResponseSchema = z.object({
  threads: z.array(chatThreadSchema),
});

export const chatThreadDetailResponseSchema = z.object({
  thread: chatThreadSchema,
  messages: z.array(chatMessageSchema),
});

export const chatModelOptionSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  provider: z.string().trim().min(1),
});

export const chatModelsResponseSchema = z.object({
  models: z.array(chatModelOptionSchema),
  defaultModel: z.string().trim().min(1),
});

export type ChatThread = z.infer<typeof chatThreadSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatThreadsResponse = z.infer<typeof chatThreadsResponseSchema>;
export type ChatThreadDetailResponse = z.infer<typeof chatThreadDetailResponseSchema>;
export type ChatModelOption = z.infer<typeof chatModelOptionSchema>;
export type ChatModelsResponse = z.infer<typeof chatModelsResponseSchema>;
