import { userIdQuerySchema } from './../types/resume.types';
export {
  type ResumeInsightsResponse,
  type ResumeUploadResponse,
  resumeUploadResponseSchema,
  parsedResumeContextSchema,
  resumeSuggestionSchema,
  type ResumeChatRequest,
  type ResumeChatResponse,
  resumeChatResponseSchema,
  type ParsedResumeContext,
  type ResumeSuggestion,
  type TokenUsage,
  tokenUsageSchema,
  resumeChatRequestSchema,
  type GenerateChatInput,
  type GenerateSuggestionsInput,
  type AiUsageShape,
} from "@/src/types/resume.types";

export {
  uploadResume,
  fetchResumeInsights,
} from "@/src/app/(app)/resume/services/resume.service";

export {
  parseApiErrorMessage,
  toErrorMessage,
} from "@/src/utils/resume/resume-client.util";

export {
  generateResumeSuggestions,
  generateResumeChatAnswer,
} from "../lib/ai/resume/resume-ai";

export {
  getZodErrorMessage,
  validateResumeFile,
  extractTextFromFile,
  buildParsedContextFromText,
  toSafeFileName,
} from "../utils/resume/resume.util";

export {
  resumeSuggestionSystemPrompt,
  resumeChatSystemPrompt,
} from "../lib/ai/resume/resume-prompt";
