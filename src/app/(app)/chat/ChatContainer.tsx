"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import { ExternalLink, FileDown, FileText, Globe, Loader2, MessageSquare, Plus } from "lucide-react";

import * as UI from "@/src/imports/UI.imports";
import * as c from "@/src/imports/chat.imports";
import {
  fetchChatModels,
  fetchChatThreadDetail,
  fetchChatThreads,
} from "@/src/app/(app)/chat/services/chat.service";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ResumePdfMeta = {
  url: string;
  name: string;
};

type GuidanceData = {
  suggestions: Array<{ title: string; suggestion: string; priority: string }>;
  weakSkills: Array<{ skillName: string; score: number; strength: string; explanation: string }>;
};

function isResumeUpdatePrompt(message: string): boolean {
  const normalized = message.toLowerCase();
  const hasVerb = /(update|rewrite|modify|change|add|remove|improve|delete|fix|edit)/.test(normalized);
  const hasTarget = /(resume|cv|pdf|section|bullet|certification|experience|skills|summary|project)/.test(normalized);

  return hasVerb && hasTarget;
}

function ChatWindow({
  chatId,
  title,
  initialMessages,
  onRefreshThreads,
  onOpenPdf,
  onAssistantFinish,
  onUserSubmit,
  onAssistantError,
  autoPrompt,
  onAutoPromptConsumed,
  availableModels,
  selectedModel,
  onModelChange,
}: {
  chatId: number;
  title: string;
  initialMessages: ChatMessage[];
  onRefreshThreads: () => Promise<void>;
  onOpenPdf: () => void;
  onAssistantFinish: () => void;
  onUserSubmit: (text: string) => void;
  onAssistantError: (message: string) => void;
  autoPrompt: string | null;
  onAutoPromptConsumed: () => void;
  availableModels: c.ChatModelOption[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}) {
  const hasAutoPromptSentRef = useRef<boolean>(false);
  const { messages, input, handleInputChange, handleSubmit, status, append } = useChat({
    id: `chat-${chatId}`,
    api: `/api/chats/${chatId}/messages`,
    initialMessages,
    body: {
      selectedModel,
    },
    onFinish: async () => {
      await onRefreshThreads();
      onAssistantFinish();
    },
    onError: (error) => {
      onAssistantError(error.message || "Failed to get AI response.");
    },
    streamProtocol: "text",
  });

  useEffect(() => {
    async function submitAutoPrompt() {
      if (!autoPrompt || hasAutoPromptSentRef.current) {
        return;
      }

      hasAutoPromptSentRef.current = true;
      onUserSubmit(autoPrompt);
      await append({
        role: "user",
        content: autoPrompt,
      });
      onAutoPromptConsumed();
    }

    void submitAutoPrompt();
  }, [append, autoPrompt, onAutoPromptConsumed, onUserSubmit]);

  const isSending = status === "submitted" || status === "streaming";

  function onSend(event: FormEvent<HTMLFormElement>) {
    if (!input.trim()) {
      event.preventDefault();
      return;
    }

    onUserSubmit(input.trim());
    handleSubmit(event);
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="truncate pr-2 text-sm font-semibold">{title}</h2>
        <UI.Button type="button" variant="outline" size="sm" onClick={onOpenPdf} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </UI.Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            Ask anything about your resume. Example: "Update my resume PDF to remove AI-900 certification."
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex animate-in fade-in slide-in-from-bottom-1 duration-300 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "border bg-muted/40"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}

        {isSending ? (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="inline-flex items-center gap-1 rounded-2xl border bg-muted/40 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={onSend} className="p-4">
        <div className="rounded-2xl border bg-card p-3 text-card-foreground shadow-sm">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="What would you like to know?"
            className="min-h-16 max-h-44 w-full resize-y bg-transparent px-1 py-1 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          <div className="mt-2 flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-4 text-sm">
              <button type="button" className="inline-flex items-center gap-2 text-muted-foreground">
                <Plus className="h-4 w-4" />
              </button>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" /> Search
              </span>
              <select
                value={selectedModel}
                onChange={(event) => onModelChange(event.target.value)}
                className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            <UI.Button
              type="submit"
              disabled={isSending}
              className="h-10 w-10 rounded-xl bg-blue-600 p-0 text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
            </UI.Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function ChatContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryChatId = searchParams.get("chatId");
  const autoPromptQuery = searchParams.get("autoprompt");

  const [threads, setThreads] = useState<c.ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>("");
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [pdfMeta, setPdfMeta] = useState<ResumePdfMeta | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isPdfDocked, setIsPdfDocked] = useState<boolean>(false);
  const [pdfVersion, setPdfVersion] = useState<number>(0);
  const [isPdfUpdating, setIsPdfUpdating] = useState<boolean>(false);
  const [guidance, setGuidance] = useState<GuidanceData | null>(null);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState<boolean>(false);
  const [availableModels, setAvailableModels] = useState<c.ChatModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const loadThreads = useCallback(async () => {
    try {
      const response = await fetchChatThreads();
      setThreads(response);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to load chats.");
    }
  }, []);

  useEffect(() => {
    async function init() {
      setIsLoadingThreads(true);
      await loadThreads();
      setIsLoadingThreads(false);
    }

    void init();
  }, [loadThreads]);

  useEffect(() => {
    async function loadModels() {
      try {
        const response = await fetchChatModels();
        setAvailableModels(response.models);
        setSelectedModel(response.defaultModel);
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Failed to load AI model options.",
        );
      }
    }

    void loadModels();
  }, []);

  useEffect(() => {
    function onChatCreated() {
      void loadThreads();
    }

    window.addEventListener("resume-chat-created", onChatCreated);
    return () => window.removeEventListener("resume-chat-created", onChatCreated);
  }, [loadThreads]);

  useEffect(() => {
    if (threads.length === 0) {
      setActiveChatId(null);
      return;
    }

    if (queryChatId) {
      const parsed = Number(queryChatId);
      const matched = threads.find((thread) => thread.id === parsed);

      if (matched) {
        setActiveChatId(matched.id);
        return;
      }
    }

    const first = threads[0];
    setActiveChatId(first.id);
    router.replace(`/chat?chatId=${first.id}`);
  }, [threads, queryChatId, router]);

  useEffect(() => {
    async function loadMessages() {
      if (!activeChatId) {
        return;
      }

      try {
        setIsLoadingMessages(true);
        const response = await fetchChatThreadDetail(activeChatId);
        setActiveTitle(response.thread.title);
        setInitialMessages(
          response.messages.map((message) => ({
            id: String(message.id),
            role: message.role,
            content: message.content,
          })),
        );
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Failed to load chat messages.");
      } finally {
        setIsLoadingMessages(false);
      }
    }

    void loadMessages();
  }, [activeChatId]);

  useEffect(() => {
    async function loadGuidance() {
      if (!activeChatId) {
        setGuidance(null);
        return;
      }

      try {
        setIsLoadingGuidance(true);
        const response = await fetch(`/api/chats/${activeChatId}/guidance`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          setGuidance(null);
          return;
        }

        const responseBody = (await response.json()) as GuidanceData;
        setGuidance(responseBody);
      } catch {
        setGuidance(null);
      } finally {
        setIsLoadingGuidance(false);
      }
    }

    void loadGuidance();
  }, [activeChatId, initialMessages.length]);

  useEffect(() => {
    async function loadPdfMeta() {
      if (!activeChatId) {
        setPdfMeta(null);
        return;
      }

      try {
        const endpoint = `/api/chats/${activeChatId}/resume-file`;
        const response = await fetch(endpoint, { method: "HEAD", cache: "no-store" });

        if (!response.ok) {
          setPdfMeta(null);
          return;
        }

        setPdfMeta({
          url: endpoint,
          name: response.headers.get("X-Resume-File-Name") ?? "Resume.pdf",
        });
      } catch {
        setPdfMeta(null);
      }
    }

    void loadPdfMeta();
  }, [activeChatId, pdfVersion]);

  const activeKey = useMemo(
    () => `${activeChatId ?? "none"}-${initialMessages.length}`,
    [activeChatId, initialMessages.length],
  );

  const viewerUrl = useMemo(() => {
    if (!pdfMeta) {
      return null;
    }

    return `${pdfMeta.url}?v=${pdfVersion}`;
  }, [pdfMeta, pdfVersion]);

  const downloadUrl = useMemo(() => {
    if (!activeChatId) {
      return null;
    }

    return `/api/chats/${activeChatId}/resume-file?download=1&v=${pdfVersion}`;
  }, [activeChatId, pdfVersion]);

  return (
    <>
      <div
        className={`grid h-[calc(100svh-5rem)] min-h-0 flex-1 gap-4 p-4 pt-0 ${
          isPdfDocked ? "lg:grid-cols-[minmax(0,1fr)_minmax(320px,38vw)]" : "grid-cols-1"
        }`}
      >
        <section className="min-h-0">
          {!activeChatId ? (
            <div className="flex h-full items-center justify-center rounded-xl border bg-background text-sm text-muted-foreground">
              {isLoadingThreads ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading chats...
                </>
              ) : (
                "Upload a resume first to create your first chat."
              )}
            </div>
          ) : isLoadingMessages ? (
            <div className="flex h-full items-center justify-center rounded-xl border bg-background text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading conversation...
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col gap-4">
              <div className="rounded-xl border bg-background p-4">
                <h3 className="text-sm font-semibold">Corrections To Implement</h3>
                {isLoadingGuidance ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 inline h-3 w-3 animate-spin" />
                    Loading corrections...
                  </p>
                ) : !guidance ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No corrections found for this chat yet.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Top Suggestions
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {guidance.suggestions.slice(0, 4).map((item, index) => (
                          <li key={`${item.title}-${index}`}>
                            <span className="font-medium text-foreground">{item.title}:</span>{" "}
                            {item.suggestion}
                            {activeChatId ? (
                              <UI.Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 h-7 cursor-pointer text-xs"
                                onClick={() =>
                                  router.replace(
                                    `/chat?chatId=${activeChatId}&autoprompt=${encodeURIComponent(
                                      `Please update my resume and apply this suggestion directly: ${item.title}. Details: ${item.suggestion}`,
                                    )}`,
                                  )
                                }
                              >
                                Apply
                              </UI.Button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Weak / Missing Skills
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {guidance.weakSkills.slice(0, 4).map((item, index) => (
                          <li key={`${item.skillName}-${index}`}>
                            <span className="font-medium text-foreground">
                              {item.skillName} ({item.score}%):
                            </span>{" "}
                            {item.explanation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <ChatWindow
                key={activeKey}
                chatId={activeChatId}
                title={activeTitle}
                initialMessages={initialMessages}
                onRefreshThreads={loadThreads}
                onOpenPdf={() => setIsPdfModalOpen(true)}
                onAssistantFinish={() => {
                  setPdfVersion((prev) => prev + 1);
                  setIsPdfUpdating(false);
                }}
                onUserSubmit={(text) => {
                  if (isResumeUpdatePrompt(text)) {
                    setIsPdfUpdating(true);
                  }
                }}
                onAssistantError={(message) => {
                  setStatusMessage(message);
                  setIsPdfUpdating(false);
                }}
                autoPrompt={autoPromptQuery}
                onAutoPromptConsumed={() => {
                  if (activeChatId) {
                    router.replace(`/chat?chatId=${activeChatId}`);
                  }
                }}
                availableModels={availableModels}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </div>
          )}
        </section>

        {isPdfDocked ? (
          <aside className="hidden min-h-0 flex-col rounded-xl border bg-background lg:flex">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="truncate text-sm font-semibold">{pdfMeta?.name ?? "Resume PDF"}</p>
              <div className="flex items-center gap-2">
                {downloadUrl ? (
                  <a href={downloadUrl} className="inline-flex">
                    <UI.Button type="button" variant="outline" size="sm" className="cursor-pointer">
                      <FileDown className="mr-2 h-4 w-4" />
                      Download
                    </UI.Button>
                  </a>
                ) : null}
                <UI.Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPdfDocked(false)}
                  className="cursor-pointer"
                >
                  Close
                </UI.Button>
              </div>
            </div>

            <div className="relative h-full min-h-0">
              {viewerUrl ? (
                <iframe src={viewerUrl} className="h-full min-h-0 w-full rounded-b-xl" title="Resume PDF" />
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                  PDF preview is not available for this chat.
                </div>
              )}
              {isPdfUpdating ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
                  <div className="rounded-lg border bg-card px-4 py-2 text-sm text-card-foreground shadow-sm animate-pulse">
                    Updating PDF...
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>

      {isPdfModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[80svh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="truncate pr-2 text-sm font-semibold">{pdfMeta?.name ?? "Resume PDF"}</p>
              <div className="flex items-center gap-2">
                {downloadUrl ? (
                  <a href={downloadUrl} className="inline-flex">
                    <UI.Button type="button" variant="outline" size="sm" className="cursor-pointer">
                      <FileDown className="mr-2 h-4 w-4" />
                      Download
                    </UI.Button>
                  </a>
                ) : null}
                <UI.Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsPdfDocked(true);
                    setIsPdfModalOpen(false);
                  }}
                  disabled={!viewerUrl}
                  className="cursor-pointer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Pop up
                </UI.Button>
                <UI.Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="cursor-pointer"
                >
                  Close
                </UI.Button>
              </div>
            </div>

            <div className="relative h-full min-h-0">
              {viewerUrl ? (
                <iframe src={viewerUrl} className="h-full w-full" title="Resume PDF modal" />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  PDF is not available for this chat yet. Ask in chat: "Update my resume PDF..." to generate one.
                </div>
              )}
              {isPdfUpdating ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
                  <div className="rounded-lg border bg-card px-4 py-2 text-sm text-card-foreground shadow-sm animate-pulse">
                    Updating PDF...
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <div className="fixed right-4 bottom-4 rounded-lg border bg-background/90 p-3 text-sm text-muted-foreground shadow">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {statusMessage}
          </div>
        </div>
      ) : null}
    </>
  );
}

