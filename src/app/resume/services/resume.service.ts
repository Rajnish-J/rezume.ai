import * as t from "@/src/types/resume.types";
import * as u from "@/src/utils/resume/resume-client.util";

export async function uploadResume(payload: {
  userId: number;
  file: File;
}): Promise<t.ResumeUploadResponse> {
  const formData = new FormData();
  formData.append("userId", payload.userId.toString());
  formData.append("file", payload.file);

  const response = await fetch("/api/resume", {
    method: "POST",
    body: formData,
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(u.toErrorMessage(responseBody));
  }

  return t.resumeUploadResponseSchema.parse(responseBody);
}

export async function fetchResumeInsights(
  userId: number,
): Promise<t.ResumeInsightsResponse> {
  const response = await fetch(`/api/resume?userId=${userId}`, {
    method: "GET",
    cache: "no-store",
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(u.toErrorMessage(responseBody));
  }

  const suggestions = responseBody.suggestions.map((item: unknown) =>
    t.resumeSuggestionSchema.parse(item),
  );

  return {
    resumeId: Number(responseBody.resumeId),
    userId: Number(responseBody.userId),
    originalFileName: String(responseBody.originalFileName),
    parsedContext: t.parsedResumeContextSchema.parse(responseBody.parsedContext),
    suggestions,
  };
}

export async function askResumeAssistant(
  payload: t.ResumeChatRequest,
): Promise<t.ResumeChatResponse> {
  const response = await fetch("/api/resume/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(u.toErrorMessage(responseBody));
  }

  return {
    answer: String(responseBody.answer ?? ""),
  };
}
