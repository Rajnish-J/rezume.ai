"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, NotebookPen } from "lucide-react";

import * as UI from "@/src/imports/UI.imports";
import * as roadmap from "@/src/imports/roadmap.imports";

export default function RoadmapDetailContainer({ roadmapId }: { roadmapId: number }) {
  const [detail, setDetail] = useState<roadmap.RoadmapDetailResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeNotesTask, setActiveNotesTask] = useState<roadmap.RoadmapTask | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        setIsLoading(true);
        const response = await roadmap.fetchRoadmapDetail(roadmapId);
        setDetail(response);
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "Failed to load roadmap.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (!Number.isInteger(roadmapId) || roadmapId <= 0) {
      setStatusMessage("Invalid roadmap id.");
      setIsLoading(false);
      return;
    }

    void loadDetail();
  }, [roadmapId]);

  const completionPercent = useMemo(() => {
    if (!detail || detail.tasks.length === 0) {
      return 0;
    }

    const completed = detail.tasks.filter((item) => item.isCompleted).length;
    return Math.round((completed / detail.tasks.length) * 100);
  }, [detail]);

  async function onToggleTask(task: roadmap.RoadmapTask) {
    if (!detail) {
      return;
    }

    try {
      const updated = await roadmap.updateRoadmapTask({
        roadmapId: detail.roadmap.roadmapId,
        taskId: task.id,
        isCompleted: !task.isCompleted,
        notes: task.notes ?? undefined,
      });

      setDetail({
        ...detail,
        tasks: detail.tasks.map((item) => (item.id === updated.id ? updated : item)),
      });
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to update task.",
      );
    }
  }

  async function onSaveNotes() {
    if (!detail || !activeNotesTask) {
      return;
    }

    try {
      setIsSavingNotes(true);
      const updated = await roadmap.updateRoadmapTask({
        roadmapId: detail.roadmap.roadmapId,
        taskId: activeNotesTask.id,
        isCompleted: activeNotesTask.isCompleted,
        notes: notesDraft,
      });

      setDetail({
        ...detail,
        tasks: detail.tasks.map((item) => (item.id === updated.id ? updated : item)),
      });
      setActiveNotesTask(null);
      setNotesDraft("");
      setStatusMessage("Notes saved.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save notes.",
      );
    } finally {
      setIsSavingNotes(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="rounded-xl border bg-background p-6">
        <h1 className="text-2xl font-semibold">Roadmap Tasks</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your interview plan with checkboxes and notes for each task.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Loading roadmap tasks...
        </div>
      ) : !detail ? (
        <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
          Roadmap not found.
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-background p-6">
            <p className="text-sm">
              <span className="font-medium">{detail.roadmap.roleName}</span> |{" "}
              {detail.roadmap.profileLevel} | {detail.roadmap.estimatedDurationWeeks} weeks
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Progress: {completionPercent}% ({detail.tasks.filter((item) => item.isCompleted).length}/
              {detail.tasks.length} tasks completed)
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-background">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Track</th>
                  <th className="px-4 py-3">Task / Plan</th>
                  <th className="px-4 py-3">Interview Round</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {detail.tasks.map((task) => (
                  <tr key={task.id} className="border-b align-top">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => onToggleTask(task)}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{task.taskName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.focus}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Output: {task.output}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{task.interviewRound}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <UI.Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => {
                          setActiveNotesTask(task);
                          setNotesDraft(task.notes ?? "");
                        }}
                      >
                        <NotebookPen className="mr-2 h-4 w-4" />
                        {task.notes ? "Edit Notes" : "Add Notes"}
                      </UI.Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeNotesTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border bg-background p-6">
            <h2 className="text-lg font-semibold">{activeNotesTask.taskName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your learning notes and implementation details.
            </p>
            <textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              className="mt-4 min-h-52 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Write what you learned, blockers, and interview talking points..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <UI.Button
                type="button"
                variant="outline"
                onClick={() => setActiveNotesTask(null)}
                disabled={isSavingNotes}
              >
                Cancel
              </UI.Button>
              <UI.Button type="button" onClick={onSaveNotes} disabled={isSavingNotes}>
                {isSavingNotes ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Notes
              </UI.Button>
            </div>
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}
    </div>
  );
}
