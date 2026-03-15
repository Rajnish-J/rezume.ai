import { z } from "zod";

export const suggestionPrioritySchema = z.enum(["low", "medium", "high"]);

export const tokenUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});

export const aiUsageShapeSchema = z.object({
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
});

export const parsedResumeContextSchema = z.object({
  summary: z.string(),
  keySkills: z.array(z.string()),
  highlights: z.array(z.string()),
  recommendedRoles: z.array(z.string()),
  targetRole: z
    .object({
      slug: z.string().trim().min(1),
      name: z.string().trim().min(1),
      version: z.number().int().positive(),
    })
    .optional(),
});

export const resumeSuggestionSchema = z.object({
  suggestionTitle: z.string(),
  suggestion: z.string(),
  category: z.string(),
  priority: suggestionPrioritySchema,
});

export const generateSuggestionsInputSchema = z.object({
  parsedContext: parsedResumeContextSchema,
  resumeText: z.string(),
});

export const generateChatInputSchema = z.object({
  parsedContext: parsedResumeContextSchema,
  suggestions: z.array(resumeSuggestionSchema),
  userMessage: z.string().trim().min(1),
});

export const skillEvidenceSchema = z.object({
  claimed: z.boolean(),
  projectProven: z.boolean(),
  experienceProven: z.boolean(),
});

export const skillStrengthSchema = z.enum(["missing", "weak", "strong"]);

export const skillAssessmentSchema = z.object({
  skillKey: z.string().trim().min(1),
  skillName: z.string().trim().min(1),
  category: z.enum(["core", "production", "professional"]),
  weight: z.number().int().positive(),
  score: z.number().int().min(0).max(100),
  strength: skillStrengthSchema,
  evidence: skillEvidenceSchema,
  explanation: z.string().trim().min(1),
});

export const readinessCoverageSchema = z.object({
  core: z.number().int().min(0).max(100),
  production: z.number().int().min(0).max(100),
  professional: z.number().int().min(0).max(100),
});

export const readinessReportSchema = z.object({
  roleSlug: z.string().trim().min(1),
  roleName: z.string().trim().min(1),
  taxonomyVersion: z.number().int().positive(),
  readinessScore: z.number().int().min(0).max(100),
  coverage: readinessCoverageSchema,
  summary: z.string().trim().min(1),
  assessments: z.array(skillAssessmentSchema),
});

export const interviewRoadmapStepSchema = z.object({
  phase: z.string().trim().min(1),
  focus: z.string().trim().min(1),
  output: z.string().trim().min(1),
  interviewRound: z.string().trim().min(1),
});

export const interviewRoadmapSchema = z.object({
  targetRole: z.string().trim().min(1),
  profileLevel: z.string().trim().min(1),
  estimatedDurationWeeks: z.number().int().positive(),
  steps: z.array(interviewRoadmapStepSchema).min(1),
});

export const resumeChatRequestSchema = z.object({
  resumeId: z.number().int().positive(),
  message: z.string().trim().min(1),
});

export const resumeUploadResponseSchema = z.object({
  resumeId: z.number().int().positive(),
  parsedContext: parsedResumeContextSchema,
  suggestions: z.array(resumeSuggestionSchema),
  tokenUsage: tokenUsageSchema,
  chatId: z.number().int().positive().nullable(),
  chatTitle: z.string().nullable(),
  readinessReport: readinessReportSchema.optional(),
  interviewRoadmap: interviewRoadmapSchema.optional(),
});

export const resumeChatResponseSchema = z.object({
  answer: z.string(),
  tokenUsage: tokenUsageSchema,
});

export const resumeInsightsResponseSchema = z.object({
  resumeId: z.number().int().positive(),
  originalFileName: z.string(),
  parsedContext: parsedResumeContextSchema,
  suggestions: z.array(resumeSuggestionSchema),
  latestChatId: z.number().int().positive().nullable(),
  latestChatTitle: z.string().nullable(),
  readinessReport: readinessReportSchema.optional(),
  interviewRoadmap: interviewRoadmapSchema.optional(),
});

export type SuggestionPriority = z.infer<typeof suggestionPrioritySchema>;
export type TokenUsage = z.infer<typeof tokenUsageSchema>;
export type AiUsageShape = z.infer<typeof aiUsageShapeSchema>;
export type ParsedResumeContext = z.infer<typeof parsedResumeContextSchema>;
export type ResumeSuggestion = z.infer<typeof resumeSuggestionSchema>;
export type GenerateSuggestionsInput = z.infer<
  typeof generateSuggestionsInputSchema
>;
export type GenerateChatInput = z.infer<typeof generateChatInputSchema>;
export type SkillEvidence = z.infer<typeof skillEvidenceSchema>;
export type SkillAssessment = z.infer<typeof skillAssessmentSchema>;
export type ReadinessCoverage = z.infer<typeof readinessCoverageSchema>;
export type ReadinessReport = z.infer<typeof readinessReportSchema>;
export type InterviewRoadmapStep = z.infer<typeof interviewRoadmapStepSchema>;
export type InterviewRoadmap = z.infer<typeof interviewRoadmapSchema>;
export type ResumeChatRequest = z.infer<typeof resumeChatRequestSchema>;
export type ResumeUploadResponse = z.infer<typeof resumeUploadResponseSchema>;
export type ResumeChatResponse = z.infer<typeof resumeChatResponseSchema>;
export type ResumeInsightsResponse = z.infer<
  typeof resumeInsightsResponseSchema
>;

