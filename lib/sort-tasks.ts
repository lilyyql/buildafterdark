import type { StoredTask, TaskPriority } from "@/lib/task-types";

function priorityOrder(p: TaskPriority): number {
  switch (p) {
    case "P0":
      return 0;
    case "P1":
      return 1;
    case "P2":
      return 2;
    default:
      return 2;
  }
}

function ms(iso: string | null): number | null {
  if (iso == null || iso === "") return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function isOverdue(dueAt: string | null, now: number): boolean {
  const t = ms(dueAt);
  return t != null && t < now;
}

function compareTie(a: StoredTask, b: StoredTask): number {
  const dueA = ms(a.dueAt) ?? Number.POSITIVE_INFINITY;
  const dueB = ms(b.dueAt) ?? Number.POSITIVE_INFINITY;
  if (dueA !== dueB) return dueA - dueB;
  const cA = ms(a.createdAt) ?? 0;
  const cB = ms(b.createdAt) ?? 0;
  return cA - cB;
}

/**
 * Spec: (1) overdue — P0→P1→P2, tie-break due then created;
 * (2) not overdue P0; (3) P1; (4) P2 — same tie-breakers within each.
 */
export function sortMainOpenTasks(tasks: StoredTask[], nowMs: number = Date.now()): StoredTask[] {
  return [...tasks].sort((a, b) => {
    const oa = isOverdue(a.dueAt, nowMs);
    const ob = isOverdue(b.dueAt, nowMs);

    if (oa && ob) {
      const pr = priorityOrder(a.priority) - priorityOrder(b.priority);
      if (pr !== 0) return pr;
      return compareTie(a, b);
    }
    if (oa && !ob) return -1;
    if (!oa && ob) return 1;

    const pa = priorityOrder(a.priority);
    const pb = priorityOrder(b.priority);
    if (pa !== pb) return pa - pb;
    return compareTie(a, b);
  });
}

export function isTaskSnoozed(snoozedUntil: string | null, nowMs: number = Date.now()): boolean {
  const t = ms(snoozedUntil);
  return t != null && t > nowMs;
}

export function splitOpenTasks(tasks: StoredTask[], nowMs: number = Date.now()) {
  const open = tasks.filter((t) => t.status === "open");
  const snoozed: StoredTask[] = [];
  const mainRaw: StoredTask[] = [];
  for (const t of open) {
    if (isTaskSnoozed(t.snoozedUntil, nowMs)) snoozed.push(t);
    else mainRaw.push(t);
  }
  const snoozedSorted = [...snoozed].sort(
    (a, b) => (ms(a.snoozedUntil) ?? 0) - (ms(b.snoozedUntil) ?? 0),
  );
  const main = sortMainOpenTasks(mainRaw, nowMs);
  return { main, snoozed: snoozedSorted };
}
