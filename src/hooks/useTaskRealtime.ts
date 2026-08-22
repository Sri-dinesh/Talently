// src/hooks/useTaskRealtime.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/types/task";

/**
 * Subscribes to Postgres CDC changes on the Task table, optionally filtered
 * by status, and keeps local state in sync live.
 */
export function useTaskRealtime(initialTasks: Task[] = [], filter?: { status?: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    try {
      const channel = supabase
        .channel("tasks-realtime-channel")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Task" },
          (payload) => {
            if (!payload.new || typeof payload.new !== "object") return;
            const updated = payload.new as Task;
            if (!updated.id) return;

            setTasks((prev) => {
              if (filter?.status && updated.status !== filter.status) {
                return prev.filter((t) => t.id !== updated.id);
              }
              const exists = prev.some((t) => t.id === updated.id);
              return exists
                ? prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
                : [updated, ...prev];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Graceful fallback if realtime is unavailable
    }
  }, [filter?.status]);

  return tasks;
}
