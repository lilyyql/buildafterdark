"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocalTasks } from "@/hooks/use-local-tasks";
import type { StoredTask, TaskArea, TaskPriority } from "@/lib/task-types";
import { areaLabel, priorityLabel } from "@/lib/labels";

const AREAS: { value: TaskArea | "all"; label: string }[] = [
  { value: "all", label: "All areas" },
  { value: "work", label: "Work" },
  { value: "hobbies", label: "Hobbies" },
  { value: "books", label: "Books" },
  { value: "side_projects", label: "Side projects" },
  { value: "exercise", label: "Exercise" },
  { value: "life_admin", label: "Life admin" },
];

const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2"];

function fmtShort(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function defaultSnoozeIso(hoursFromNow: number) {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow);
  return toLocalDatetimeValue(d);
}

function toLocalDatetimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function tomorrowNineAm() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toLocalDatetimeValue(d);
}

export function TaskApp() {
  const { hydrated, main, snoozed, completed, addTask, updateTask, reload } =
    useLocalTasks();
  const [areaFilter, setAreaFilter] = useState<TaskArea | "all">("all");
  const [showDone, setShowDone] = useState(false);
  const [snoozeOpenId, setSnoozeOpenId] = useState<string | null>(null);
  const [snoozeDraft, setSnoozeDraft] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("P1");
  const [newArea, setNewArea] = useState<TaskArea>("work");
  const [newDue, setNewDue] = useState("");

  const filterArea = useCallback(
    (list: typeof main) => {
      if (areaFilter === "all") return list;
      return list.filter((t) => t.area === areaFilter);
    },
    [areaFilter],
  );

  const mainF = useMemo(() => filterArea(main), [main, filterArea]);
  const snoozedF = useMemo(() => filterArea(snoozed), [snoozed, filterArea]);

  function createTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    let dueAt: string | null = null;
    if (newDue) {
      const d = new Date(newDue);
      if (!Number.isNaN(d.getTime())) dueAt = d.toISOString();
    }
    addTask({ title, priority: newPriority, area: newArea, dueAt });
    setNewTitle("");
    setNewDue("");
  }

  function patchTask(id: string, patch: Partial<StoredTask>) {
    updateTask(id, patch);
  }

  function markDone(id: string) {
    patchTask(id, {
      status: "done",
      completedAt: new Date().toISOString(),
    });
  }

  function clearSnooze(id: string) {
    patchTask(id, { snoozedUntil: null });
  }

  function openSnooze(id: string, currentIso?: string | null) {
    setSnoozeOpenId(id);
    if (currentIso) {
      const d = new Date(currentIso);
      if (!Number.isNaN(d.getTime())) setSnoozeDraft(toLocalDatetimeValue(d));
      else setSnoozeDraft(defaultSnoozeIso(1));
    } else {
      setSnoozeDraft(defaultSnoozeIso(1));
    }
  }

  function submitSnooze(id: string) {
    if (!snoozeDraft) return;
    const d = new Date(snoozeDraft);
    if (Number.isNaN(d.getTime())) return;
    patchTask(id, { snoozedUntil: d.toISOString() });
    setSnoozeOpenId(null);
  }

  const inputClass =
    "rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] shadow-sm transition placeholder:text-[var(--muted)]/70 focus:border-[var(--accent)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20";

  if (!hydrated) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl p-8">
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl p-4 pb-16 md:p-8">
      <main className="min-w-0">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]/90">
              Today
            </p>
            <h1 className="bg-gradient-to-r from-[#6d5acd] via-[#8b7fd8] to-[#a990f0] bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Smart To-Do
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">
              Saved in this browser. Sorted by overdue, then P0 → P1 → P2.
            </p>
          </div>
          <button
            type="button"
            onClick={() => reload()}
            className="rounded-full border border-[var(--border)] bg-[var(--card)]/80 px-4 py-2 text-sm text-[var(--muted)] shadow-sm backdrop-blur-sm transition hover:border-[var(--accent)]/25 hover:bg-[var(--pill-muted)] hover:text-[var(--foreground)]"
          >
            Reload
          </button>
        </header>

        <form
          onSubmit={createTask}
          className="mb-8 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--card)]/90 p-5 shadow-[var(--shadow-card)] backdrop-blur-sm md:flex-row md:flex-wrap md:items-end"
        >
          <label className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-xs font-medium text-[var(--muted)]">
            Title
            <input
              className={inputClass}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs doing?"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--muted)]">
            Priority
            <select
              className={`${inputClass} cursor-pointer`}
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {priorityLabel(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--muted)]">
            Area
            <select
              className={`${inputClass} cursor-pointer`}
              value={newArea}
              onChange={(e) => setNewArea(e.target.value as TaskArea)}
            >
              {AREAS.filter((a) => a.value !== "all").map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[180px] flex-col gap-1.5 text-xs font-medium text-[var(--muted)]">
            Due (optional)
            <input
              type="datetime-local"
              className={inputClass}
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg hover:brightness-[1.03] motion-reduce:hover:translate-y-0 active:translate-y-0"
          >
            Add task
          </button>
        </form>

        <div className="mb-5 flex flex-wrap items-center gap-4">
          <label className="text-xs font-medium text-[var(--muted)]">
            Filter
            <select
              className={`${inputClass} ml-2 inline-block w-auto py-1.5 pr-8`}
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value as TaskArea | "all")}
            >
              {AREAS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-transparent px-1 py-0.5 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--border)] hover:bg-[var(--pill-muted)]/80">
            <input
              type="checkbox"
              className="size-4 rounded border-[var(--border)] accent-[var(--accent)]"
              checked={showDone}
              onChange={(e) => setShowDone(e.target.checked)}
            />
            Show completed
          </label>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
            Main list
          </h2>
          {mainF.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--pill-muted)]/50 px-4 py-8 text-center text-sm text-[var(--muted)]">
              Nothing here—add a task or adjust filters.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {mainF.map((t) => (
                <li
                  key={t.id}
                  className="group flex flex-col gap-3 rounded-3xl border border-[var(--border)] bg-[var(--card)]/95 p-4 shadow-sm transition hover:border-[color-mix(in_oklab,var(--accent)_22%,var(--border))] hover:shadow-[var(--shadow-hover)] sm:flex-row sm:items-start"
                >
                  <div className="flex flex-1 gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-[1.125rem] shrink-0 rounded-md border-[var(--border)] accent-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      aria-label={`Mark done: ${t.title}`}
                      onChange={() => markDone(t.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--foreground)]">{t.title}</span>
                        <span className="rounded-full bg-[var(--pill)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]/85">
                          {priorityLabel(t.priority)}
                        </span>
                        <span className="rounded-full bg-[color-mix(in_oklab,var(--snooze)_18%,var(--pill))] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]/80">
                          {areaLabel(t.area)}
                        </span>
                        {t.dueAt && (
                          <span className="text-xs text-[var(--muted)]">
                            Due {fmtShort(t.dueAt)}
                          </span>
                        )}
                      </div>
                      {t.notes && (
                        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{t.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                    {snoozeOpenId === t.id ? (
                      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--pill-muted)]/60 p-3">
                        <input
                          type="datetime-local"
                          className={inputClass}
                          value={snoozeDraft}
                          onChange={(e) => setSnoozeDraft(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className="rounded-xl bg-[color-mix(in_oklab,var(--snooze)_22%,white)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[color-mix(in_oklab,var(--snooze)_30%,white)]"
                            onClick={() => setSnoozeDraft(defaultSnoozeIso(1))}
                          >
                            +1h
                          </button>
                          <button
                            type="button"
                            className="rounded-xl bg-[color-mix(in_oklab,var(--snooze)_22%,white)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[color-mix(in_oklab,var(--snooze)_30%,white)]"
                            onClick={() => setSnoozeDraft(tomorrowNineAm())}
                          >
                            Tomorrow 9:00
                          </button>
                          <button
                            type="button"
                            className="rounded-xl bg-[var(--accent)] px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-[1.05]"
                            onClick={() => submitSnooze(t.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--border)]/40"
                            onClick={() => setSnoozeOpenId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rounded-xl border border-[color-mix(in_oklab,var(--snooze)_45%,var(--border))] bg-[color-mix(in_oklab,var(--snooze)_12%,white)] px-3 py-1.5 text-xs font-medium text-[var(--snooze)] transition hover:bg-[color-mix(in_oklab,var(--snooze)_22%,white)]"
                        onClick={() => openSnooze(t.id)}
                      >
                        Snooze
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-10 rounded-3xl border border-[color-mix(in_oklab,var(--snooze)_35%,var(--border))] bg-[color-mix(in_oklab,var(--snooze)_9%,white)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--snooze)]">
            <span className="inline-block size-2 rounded-full bg-[var(--snooze)]/70" aria-hidden />
            Snoozed (always visible)
          </h2>
          {snoozedF.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No snoozed tasks.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {snoozedF.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">{t.title}</div>
                    <div className="mt-0.5 text-xs text-[var(--muted)]">
                      Wake {t.snoozedUntil ? fmtShort(t.snoozedUntil) : ""} ·{" "}
                      {priorityLabel(t.priority)} · {areaLabel(t.area)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--accent)]/30 hover:bg-[var(--pill-muted)]"
                      onClick={() => clearSnooze(t.id)}
                    >
                      Wake now
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-[color-mix(in_oklab,var(--snooze)_45%,var(--border))] bg-[color-mix(in_oklab,var(--snooze)_12%,white)] px-3 py-1.5 text-xs font-medium text-[var(--snooze)] transition hover:bg-[color-mix(in_oklab,var(--snooze)_20%,white)]"
                      onClick={() => openSnooze(t.id, t.snoozedUntil)}
                    >
                      Edit
                    </button>
                  </div>
                  {snoozeOpenId === t.id && (
                    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--pill-muted)]/50 p-3 sm:col-span-2">
                      <input
                        type="datetime-local"
                        className={`${inputClass} mb-2 w-full py-2 text-xs`}
                        value={snoozeDraft}
                        onChange={(e) => setSnoozeDraft(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-[1.05]"
                          onClick={() => submitSnooze(t.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--border)]/40"
                          onClick={() => setSnoozeOpenId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {showDone && (
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/60 p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
              Completed
            </h2>
            {completed.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No completed tasks yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {completed.map((t) => (
                  <li
                    key={t.id}
                    className="text-sm text-[var(--muted)] line-through decoration-[var(--muted)]/50"
                  >
                    {t.title}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
