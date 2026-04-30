export type TaskPriority = "P0" | "P1" | "P2";

export type TaskArea =
  | "work"
  | "hobbies"
  | "books"
  | "side_projects"
  | "exercise"
  | "life_admin";

export type TaskStatus = "open" | "done";

/** Task row persisted in `localStorage` (ISO date strings). */
export interface StoredTask {
  id: string;
  title: string;
  notes: string | null;
  dueAt: string | null;
  priority: TaskPriority;
  area: TaskArea;
  status: TaskStatus;
  snoozedUntil: string | null;
  completedAt: string | null;
  createdAt: string;
}
