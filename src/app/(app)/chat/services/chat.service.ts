import * as c from "@/src/imports/chat.imports";

export async function fetchChatThreads(): Promise<c.ChatThread[]> {
  const response = await fetch("/api/chats", {
    method: "GET",
    cache: "no-store",
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(responseBody?.message || "Failed to fetch chats.");
  }

  return c.chatThreadsResponseSchema.parse(responseBody).threads;
}

export async function fetchChatThreadDetail(chatId: number): Promise<c.ChatThreadDetailResponse> {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "GET",
    cache: "no-store",
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(responseBody?.message || "Failed to fetch chat.");
  }

  return c.chatThreadDetailResponseSchema.parse(responseBody);
}
