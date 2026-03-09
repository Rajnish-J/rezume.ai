"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import { ExternalLink, FileText, Loader2, MessageSquare } from "lucide-react";

import * as UI from "@/src/imports/UI.imports";
import * as c from "@/src/imports/chat.imports";
import {
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

function ChatWindow({
  chatId,
  title,
  initialMessages,
  onRefreshThreads,
  onOpenPdf,
}: {
  chatId: number;
  title: string;
  initialMessages: ChatMessage[];
  onRefreshThreads: () => Promise<void>;
  onOpenPdf: () => void;
}) {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    id: `chat-${chatId}`,
    api: `/api/chats/${chatId}/messages`,
    initialMessages,
    onFinish: async () => {
      await onRefreshThreads();
    },
  });

  const isSending = status === "submitted" || status === "streaming";

  function onSend(event: FormEvent<HTMLFormElement>) {
    if (!input.trim()) {
      event.preventDefault();
      return;
    }

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
            Start the conversation about this resume.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "border bg-muted/40"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={onSend} className="border-t p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask follow-up questions about your resume..."
            className="min-h-12 max-h-40 flex-1 resize-y rounded-md border bg-background px-3 py-2 text-sm"
          />
          <UI.Button type="submit" disabled={isSending} className="cursor-pointer">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </UI.Button>
        </div>
      </form>
    </div>
  );
}

export default function ChatContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryChatId = searchParams.get("chatId");

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
  }, [activeChatId]);

  const activeKey = useMemo(
    () => `${activeChatId ?? "none"}-${initialMessages.length}`,
    [activeChatId, initialMessages.length],
  );

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
            <ChatWindow
              key={activeKey}
              chatId={activeChatId}
              title={activeTitle}
              initialMessages={initialMessages}
              onRefreshThreads={loadThreads}
              onOpenPdf={() => setIsPdfModalOpen(true)}
            />
          )}
        </section>

        {isPdfDocked ? (
          <aside className="hidden min-h-0 flex-col rounded-xl border bg-background lg:flex">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="truncate text-sm font-semibold">{pdfMeta?.name ?? "Resume PDF"}</p>
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
            {pdfMeta ? (
              <iframe src={pdfMeta.url} className="h-full min-h-0 w-full rounded-b-xl" title="Resume PDF" />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                PDF preview is not available for this chat.
              </div>
            )}
          </aside>
        ) : null}
      </div>

      {isPdfModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[80svh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="truncate pr-2 text-sm font-semibold">{pdfMeta?.name ?? "Resume PDF"}</p>
              <div className="flex items-center gap-2">
                <UI.Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsPdfDocked(true);
                    setIsPdfModalOpen(false);
                  }}
                  disabled={!pdfMeta}
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

            <div className="h-full min-h-0">
              {pdfMeta ? (
                <iframe src={pdfMeta.url} className="h-full w-full" title="Resume PDF modal" />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  PDF is not available for this chat. Re-upload the resume once to store file binary correctly.
                </div>
              )}
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


