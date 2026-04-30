"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadTasks, newTask, saveTasks } from "@/lib/local-storage-tasks";
import { splitOpenTasks } from "@/lib/sort-tasks";
import type { StoredTask, TaskArea, TaskPriority } from "@/lib/task-types";

export function useLocalTasks() {
  const [tasks, setTasks] = useState<StoredTask[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTasks(loadTasks());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveTasks(tasks);
  }, [tasks, hydrated]);

  const { main, snoozed, completed } = useMemo(() => {
    const open = tasks.filter((t) => t.status === "open");
    const { main: m, snoozed: s } = splitOpenTasks(open);
    const done = tasks
      .filter((t) => t.status === "done")
      .sort((a, b) => {
        const ca = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const cb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return cb - ca;
      })
      .slice(0, 40);
    return { main: m, snoozed: s, completed: done };
  }, [tasks]);

  const addTask = useCallback((input: {
    title: string;
    priority: TaskPriority;
    area: TaskArea;
    dueAt: string | null;
  }) => {
    setTasks((prev) => [...prev, newTask(input)]);
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<StoredTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }, []);

  const reload = useCallback(() => {
    setTasks(loadTasks());
  }, []);

  return {
    hydrated,
    main,
    snoozed,
    completed,
    addTask,
    updateTask,
    reload,
  };
}
