"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Milestone } from "lucide-react";

import * as UI from "@/src/imports/UI.imports";
import * as roadmap from "@/src/imports/roadmap.imports";

export default function RoadmapContainer() {
  const router = useRouter();
  const [cards, setCards] = useState<roadmap.RoadmapCard[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCards() {
      try {
        setIsLoading(true);
        const response = await roadmap.fetchRoadmapCards();
        setCards(response);
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "Failed to load roadmaps.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadCards();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="rounded-xl border bg-background p-6">
        <h1 className="text-2xl font-semibold">Roadmaps</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Each card represents a generated roadmap for a resume/chat context.
          Open one to track tasks and add learning notes.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Loading roadmap cards...
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
          No roadmap found yet. Upload resume with target role and generate one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.roadmapId}
              type="button"
              className="rounded-xl border bg-background p-4 text-left transition hover:border-primary/40"
              onClick={() => router.push(`/roadmap/${card.roadmapId}`)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{card.roleName}</p>
                <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                  {card.completedTasks}/{card.totalTasks}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Profile: {card.profileLevel} | {card.estimatedDurationWeeks} weeks
              </p>
              {card.chatTitle ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Chat: {card.chatTitle}
                </p>
              ) : null}
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  <Milestone className="mr-1 inline h-3 w-3" />
                  Resume #{card.resumeId}
                </span>
                <span>
                  <CalendarClock className="mr-1 inline h-3 w-3" />
                  {new Date(card.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {statusMessage ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}
    </div>
  );
}
