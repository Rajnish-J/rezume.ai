import { z } from "zod";

export const suggestionPrioritySchema = z.enum(["low", "medium", "high"]);

export const parsedResumeContextSchema = z.object({
  summary: z.string(),
  keySkills: z.array(z.string()),
  highlights: z.array(z.string()),
  recommendedRoles: z.array(z.string()),
});

export const resumeSuggestionSchema = z.object({
  suggestionTitle: z.string(),
  suggestion: z.string(),
  category: z.string(),
  priority: suggestionPrioritySchema,
});

export const uploadResumeBodySchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const userIdQuerySchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const resumeChatRequestSchema = z.object({
  userId: z.number().int().positive(),
  resumeId: z.number().int().positive(),
  message: z.string().trim().min(1),
});

export const resumeUploadResponseSchema = z.object({
  resumeId: z.number().int().positive(),
  userId: z.number().int().positive(),
  parsedContext: parsedResumeContextSchema,
  suggestions: z.array(resumeSuggestionSchema),
});

export type SuggestionPriority = z.infer<typeof suggestionPrioritySchema>;
export type ParsedResumeContext = z.infer<typeof parsedResumeContextSchema>;
export type ResumeSuggestion = z.infer<typeof resumeSuggestionSchema>;
export type UploadResumeBody = z.infer<typeof uploadResumeBodySchema>;
export type UserIdQuery = z.infer<typeof userIdQuerySchema>;
export type ResumeChatRequest = z.infer<typeof resumeChatRequestSchema>;
export type ResumeUploadResponse = z.infer<typeof resumeUploadResponseSchema>;

export type ResumeInsightsResponse = {
  resumeId: number;
  userId: number;
  originalFileName: string;
  parsedContext: ParsedResumeContext;
  suggestions: ResumeSuggestion[];
};

export type ResumeChatResponse = {
  answer: string;
};
