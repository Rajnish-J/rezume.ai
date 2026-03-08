import * as r from "@/src/imports/resume.imports";

export async function uploadResume(payload: {
  userId: number;
  file: File;
}): Promise<r.ResumeUploadResponse> {
  const formData = new FormData();
  formData.append("userId", payload.userId.toString());
  formData.append("file", payload.file);

  const response = await fetch("/api/resume", {
    method: "POST",
    body: formData,
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(r.toErrorMessage(responseBody));
  }

  return r.resumeUploadResponseSchema.parse(responseBody);
}

export async function fetchResumeInsights(
  userId: number,
): Promise<r.ResumeInsightsResponse> {
  const response = await fetch(`/api/resume?userId=${userId}`, {
    method: "GET",
    cache: "no-store",
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(r.toErrorMessage(responseBody));
  }

  const suggestions = responseBody.suggestions.map((item: unknown) =>
    r.resumeSuggestionSchema.parse(item),
  );

  return {
    resumeId: Number(responseBody.resumeId),
    userId: Number(responseBody.userId),
    originalFileName: String(responseBody.originalFileName),
    parsedContext: r.parsedResumeContextSchema.parse(
      responseBody.parsedContext,
    ),
    suggestions,
  };
}

export async function askResumeAssistant(
  payload: r.ResumeChatRequest,
): Promise<r.ResumeChatResponse> {
  const response = await fetch("/api/resume/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(r.toErrorMessage(responseBody));
  }

  return r.resumeChatResponseSchema.parse(responseBody);
}
