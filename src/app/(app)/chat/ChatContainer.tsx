"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import { Loader2, MessageSquare, Plus } from "lucide-react";

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

function ChatWindow({
  chatId,
  title,
  initialMessages,
  onRefreshThreads,
}: {
  chatId: number;
  title: string;
  initialMessages: ChatMessage[];
  onRefreshThreads: () => Promise<void>;
}) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
  } = useChat({
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
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border bg-background">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
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
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border bg-muted/40"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={onSend} className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask follow-up questions about your resume..."
            className="min-h-12 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm"
          />
          <UI.Button
            type="submit"
            disabled={isSending}
            className="cursor-pointer self-end"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </UI.Button>
        </div>
      </form>
    </div>
  );
}

export default function ChatContainer() {
  const searchParams = useSearchParams();
  const queryChatId = searchParams.get("chatId");

  const [threads, setThreads] = useState<c.ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>("");
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  async function loadThreads() {
    try {
      const response = await fetchChatThreads();
      setThreads(response);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to load chats.");
    }
  }

  useEffect(() => {
    async function init() {
      setIsLoadingThreads(true);
      await loadThreads();
      setIsLoadingThreads(false);
    }

    void init();
  }, []);

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

    if (!activeChatId) {
      setActiveChatId(threads[0].id);
    }
  }, [threads, queryChatId, activeChatId]);

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

  const activeKey = useMemo(
    () => `${activeChatId ?? "none"}-${initialMessages.length}`,
    [activeChatId, initialMessages.length],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="rounded-xl border bg-background p-6">
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Resume-linked conversations are saved and available by chat name.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border bg-background p-3">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-sm font-medium">Your chats</p>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            {isLoadingThreads ? (
              <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading chats...
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Upload a resume first to create your first chat.
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm cursor-pointer ${
                    activeChatId === thread.id ? "bg-muted" : "bg-background"
                  }`}
                  onClick={() => setActiveChatId(thread.id)}
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">{thread.title}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section>
          {!activeChatId ? (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center rounded-xl border bg-background text-sm text-muted-foreground">
              Select a chat to start.
            </div>
          ) : isLoadingMessages ? (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center rounded-xl border bg-background text-sm text-muted-foreground">
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
            />
          )}
        </section>
      </div>

      {statusMessage ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}
    </div>
  );
}
