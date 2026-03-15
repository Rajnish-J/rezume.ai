"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import * as c from "@/src/imports/chat.imports";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/src/components/ui/sidebar";
import { fetchChatThreads } from "@/src/app/(app)/chat/services/chat.service";

export function NavChats() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedChatId = Number(searchParams.get("chatId"));

  const [threads, setThreads] = useState<c.ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const activeId = useMemo(
    () => (Number.isInteger(selectedChatId) ? selectedChatId : null),
    [selectedChatId],
  );

  const loadThreads = useCallback(async () => {
    try {
      const response = await fetchChatThreads();
      setThreads(response);
    } catch {
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void loadThreads();
  }, [loadThreads, pathname]);

  useEffect(() => {
    function onChatCreated() {
      void loadThreads();
    }

    window.addEventListener("resume-chat-created", onChatCreated);
    return () => window.removeEventListener("resume-chat-created", onChatCreated);
  }, [loadThreads]);

  return (
    <SidebarGroup className="min-h-0 group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Your chats</SidebarGroupLabel>
      <SidebarGroupContent className="min-h-0">
        <div className="max-h-[42svh] space-y-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-2 text-xs text-sidebar-foreground/70">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading chats...
            </div>
          ) : threads.length === 0 ? (
            <p className="px-2 py-2 text-xs text-sidebar-foreground/70">
              Upload a resume to start your first chat.
            </p>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => router.push(`/chat?chatId=${thread.id}`)}
                className={`w-full rounded-md px-2 py-2 text-left text-sm transition-colors cursor-pointer ${
                  pathname === "/chat" && activeId === thread.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                title={thread.title}
              >
                <span className="line-clamp-2">{thread.title}</span>
              </button>
            ))
          )}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}