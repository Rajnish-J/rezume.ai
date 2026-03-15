import * as r from "@/src/imports/resume.imports";

export async function uploadResume(payload: {
  file: File;
}): Promise<r.ResumeUploadResponse> {
  const formData = new FormData();
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

export async function fetchResumeInsights(): Promise<r.ResumeInsightsResponse> {
  const response = await fetch("/api/resume", {
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
    originalFileName: String(responseBody.originalFileName),
    parsedContext: r.parsedResumeContextSchema.parse(
      responseBody.parsedContext,
    ),
    suggestions,
    latestChatId:
      responseBody.latestChatId == null ? null : Number(responseBody.latestChatId),
    latestChatTitle:
      responseBody.latestChatTitle == null
        ? null
        : String(responseBody.latestChatTitle),
    readinessReport: responseBody.readinessReport
      ? r.readinessReportSchema.parse(responseBody.readinessReport)
      : undefined,
    interviewRoadmap: responseBody.interviewRoadmap
      ? r.interviewRoadmapSchema.parse(responseBody.interviewRoadmap)
      : undefined,
  };
}
