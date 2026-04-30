import type { TaskArea, TaskPriority } from "@/lib/task-types";

const AREA_LABELS: Record<TaskArea, string> = {
  work: "Work",
  hobbies: "Hobbies",
  books: "Books",
  side_projects: "Side projects",
  exercise: "Exercise",
  life_admin: "Life admin",
};

export function areaLabel(area: TaskArea): string {
  return AREA_LABELS[area] ?? area;
}

export function priorityLabel(p: TaskPriority): string {
  return p;
}
