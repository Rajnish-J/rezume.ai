"use client";

import { useState } from "react";
import { Loader2, MessageSquareText, Sparkles, Upload } from "lucide-react";

import * as UI from "@/src/imports/UI.imports"
import * as r from "@/src/imports/resume.imports"

export default function ResumeContainer() {
  const [userIdInput, setUserIdInput] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [insights, setInsights] = useState<r.ResumeInsightsResponse | null>(null);
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatAnswer, setChatAnswer] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isChatting, setIsChatting] = useState<boolean>(false);

  const parsedUserId = Number(userIdInput);

  async function onUploadResume() {
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      setStatusMessage("Enter a valid user id before upload.");
      return;
    }

    if (!selectedFile) {
      setStatusMessage("Choose a resume file first.");
      return;
    }

    try {
      setIsUploading(true);
      setStatusMessage("Uploading and generating suggestions...");

      const response = await r.uploadResume({
        userId: parsedUserId,
        file: selectedFile,
      });

      setInsights({
        resumeId: response.resumeId,
        userId: response.userId,
        originalFileName: selectedFile.name,
        parsedContext: response.parsedContext,
        suggestions: response.suggestions,
      });
      setStatusMessage("Resume uploaded and suggestions generated.");
      setChatAnswer("");
    } catch (error) {
      setStatusMessage(r.parseApiErrorMessage(error, "Upload failed."));
    } finally {
      setIsUploading(false);
    }
  }

  async function onLoadInsights() {
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      setStatusMessage("Enter a valid user id to fetch insights.");
      return;
    }

    try {
      setIsFetching(true);
      setStatusMessage("Loading latest resume insights...");

      const response = await r.fetchResumeInsights(parsedUserId);
      setInsights(response);
      setStatusMessage("Loaded latest resume insights.");
      setChatAnswer("");
    } catch (error) {
      setStatusMessage(r.parseApiErrorMessage(error, "Could not fetch insights."));
      setInsights(null);
    } finally {
      setIsFetching(false);
    }
  }

  async function onAskAssistant() {
    if (!insights) {
      setStatusMessage("Upload or load a resume before asking assistant.");
      return;
    }

    if (!chatMessage.trim()) {
      setStatusMessage("Type your question for the assistant.");
      return;
    }

    try {
      setIsChatting(true);
      setStatusMessage("Generating assistant response...");

      const response = await r.askResumeAssistant({
        userId: insights.userId,
        resumeId: insights.resumeId,
        message: chatMessage,
      });

      setChatAnswer(response.answer);
      setStatusMessage("Assistant response ready.");
    } catch (error) {
      setStatusMessage(r.parseApiErrorMessage(error, "Assistant request failed."));
    } finally {
      setIsChatting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="rounded-xl border bg-background p-6">
        <h1 className="text-2xl font-semibold">Resume Studio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload a resume, store parsed context, and receive actionable AI suggestions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-background p-6">
          <h2 className="text-lg font-medium">Resume Upload</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <UI.Input
                type="number"
                value={userIdInput}
                onChange={(event) => setUserIdInput(event.target.value)}
                placeholder="Enter user id"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resume File</label>
              <UI.Input
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <UI.Button
                onClick={onUploadResume}
                disabled={isUploading || isFetching}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload + Suggest
              </UI.Button>

              <UI.Button
                variant="secondary"
                onClick={onLoadInsights}
                disabled={isUploading || isFetching}
              >
                {isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Load Latest
              </UI.Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-6">
          <h2 className="text-lg font-medium">Parsed Context</h2>
          {!insights ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Upload a resume or load existing insights to see parsed context.
            </p>
          ) : (
            <div className="mt-4 space-y-4 text-sm">
              <p>
                <span className="font-medium">Summary:</span>{" "}
                {insights.parsedContext.summary}
              </p>
              <p>
                <span className="font-medium">Key Skills:</span>{" "}
                {insights.parsedContext.keySkills.join(", ")}
              </p>
              <p>
                <span className="font-medium">Recommended Roles:</span>{" "}
                {insights.parsedContext.recommendedRoles.join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-background p-6">
        <h2 className="text-lg font-medium">AI Suggestions</h2>
        {!insights || insights.suggestions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Suggestions will appear after resume processing.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {insights.suggestions.map((item, index) => (
              <div key={`${item.suggestionTitle}-${index}`} className="rounded-lg border p-4">
                <p className="text-sm font-medium">{item.suggestionTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.suggestion}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {item.category} � {item.priority}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-background p-6">
        <h2 className="text-lg font-medium">Resume Assistant Chat</h2>
        <div className="mt-4 space-y-3">
          <textarea
            className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={chatMessage}
            onChange={(event) => setChatMessage(event.target.value)}
            placeholder="Ask: How can I improve my resume for frontend roles?"
          />
          <UI.Button onClick={onAskAssistant} disabled={isChatting || !insights}>
            {isChatting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquareText className="mr-2 h-4 w-4" />
            )}
            Ask Assistant
          </UI.Button>

          {chatAnswer ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              {chatAnswer}
            </div>
          ) : null}
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}
    </div>
  );
}
