"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Loader2, MessageSquareText, Sparkles, Upload } from "lucide-react";

import * as UI from "@/src/imports/UI.imports";
import * as r from "@/src/imports/resume.imports";

export default function ResumeContainer() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [insights, setInsights] = useState<r.ResumeInsightsResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const analytics = useMemo(() => {
    if (!insights) {
      return [] as Array<{ label: string; value: string; tone?: "danger" | "warning" | "ok" }>;
    }

    const highPriority = insights.suggestions.filter((item) => item.priority === "high").length;
    const mediumPriority = insights.suggestions.filter((item) => item.priority === "medium").length;
    const lowPriority = insights.suggestions.filter((item) => item.priority === "low").length;

    return [
      { label: "Detected Skills", value: String(insights.parsedContext.keySkills.length), tone: "ok" as const },
      { label: "Suggested Roles", value: String(insights.parsedContext.recommendedRoles.length), tone: "ok" as const },
      { label: "High Priority Fixes", value: String(highPriority), tone: highPriority > 0 ? "danger" : "ok" as const },
      { label: "Medium / Low", value: `${mediumPriority} / ${lowPriority}`, tone: "warning" as const },
    ];
  }, [insights]);

  async function onUploadResume() {
    if (!selectedFile) {
      setStatusMessage("Choose a resume file first.");
      return;
    }

    try {
      setIsUploading(true);
      setStatusMessage("Uploading and generating suggestions...");

      const response = await r.uploadResume({
        file: selectedFile,
      });

      setInsights({
        resumeId: response.resumeId,
        originalFileName: selectedFile.name,
        parsedContext: response.parsedContext,
        suggestions: response.suggestions,
        latestChatId: response.chatId,
        latestChatTitle: response.chatTitle,
      });
      if (response.chatId) {
        window.dispatchEvent(
          new CustomEvent("resume-chat-created", {
            detail: { chatId: response.chatId },
          }),
        );
      }

      setStatusMessage(
        response.chatId
          ? "Resume uploaded. A new linked chat is now available in the sidebar."
          : "Resume uploaded. Suggestions saved.",
      );
    } catch (error) {
      setStatusMessage(r.parseApiErrorMessage(error, "Upload failed."));
    } finally {
      setIsUploading(false);
    }
  }

  async function onLoadInsights() {
    try {
      setIsFetching(true);
      setStatusMessage("Loading your latest resume insights...");

      const response = await r.fetchResumeInsights();
      setInsights(response);
      setStatusMessage("Loaded latest resume insights.");
    } catch (error) {
      setStatusMessage(r.parseApiErrorMessage(error, "Could not fetch insights."));
      setInsights(null);
    } finally {
      setIsFetching(false);
    }
  }

  function onOpenChat() {
    if (!insights?.latestChatId) {
      setStatusMessage("No chat found yet. Upload a resume first.");
      return;
    }

    router.push(`/chat?chatId=${insights.latestChatId}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="rounded-xl border bg-background p-6">
        <h1 className="text-2xl font-semibold">Resume Studio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload a resume and your data is automatically stored under your signed-in account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-background p-6">
          <h2 className="text-lg font-medium">Resume Upload</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Resume File</label>
              <UI.Input
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <UI.Button
                onClick={onUploadResume}
                disabled={isUploading || isFetching}
                className="cursor-pointer"
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
                className="cursor-pointer"
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
          <h2 className="text-lg font-medium">Simplistic Analytics</h2>
          {!insights ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Upload a resume to generate quick analytics and a linked chat.
            </p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {analytics.map((item) => (
                  <div key={item.label} className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p
                      className={`mt-2 text-xl font-semibold ${
                        item.tone === "danger"
                          ? "text-red-500"
                          : item.tone === "warning"
                            ? "text-amber-500"
                            : ""
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border p-4 text-sm">
                <p>
                  <span className="font-medium">Current Summary:</span> {insights.parsedContext.summary}
                </p>
                <p className="mt-2 text-muted-foreground">
                  For deeper interviewer-style review and role-targeted edits, continue in chat.
                </p>
                <UI.Button
                  variant="outline"
                  onClick={onOpenChat}
                  disabled={!insights.latestChatId}
                  className="mt-3 cursor-pointer"
                >
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Chat For More Insights
                </UI.Button>
              </div>
            </>
          )}
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
              <span className="font-medium">Summary:</span> {insights.parsedContext.summary}
            </p>
            <p>
              <span className="font-medium">Key Skills:</span> {insights.parsedContext.keySkills.join(", ")}
            </p>
            <p>
              <span className="font-medium">Recommended Roles:</span>{" "}
              {insights.parsedContext.recommendedRoles.join(", ")}
            </p>
            {insights.latestChatTitle ? (
              <p>
                <span className="font-medium">Linked Chat:</span> {insights.latestChatTitle}
              </p>
            ) : null}
          </div>
        )}
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
                  {item.category} - {item.priority}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {statusMessage ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {statusMessage}
          </div>
        </div>
      ) : null}
    </div>
  );
}
