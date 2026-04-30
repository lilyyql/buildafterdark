import type { StoredTask, TaskArea, TaskPriority } from "@/lib/task-types";

export const STORAGE_KEY = "smart-todo.tasks.v1";

export function createTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function loadTasks(): StoredTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredTask[];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: StoredTask[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function newTask(input: {
  title: string;
  priority: TaskPriority;
  area: TaskArea;
  dueAt: string | null;
}): StoredTask {
  const now = new Date().toISOString();
  return {
    id: createTaskId(),
    title: input.title,
    notes: null,
    dueAt: input.dueAt,
    priority: input.priority,
    area: input.area,
    status: "open",
    snoozedUntil: null,
    completedAt: null,
    createdAt: now,
  };
}
