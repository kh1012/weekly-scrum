import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export interface CollaboratorEntry {
  name: string;
  relation: "pair" | "pre" | "post";
}

export interface SnapshotEntry {
  id: string;
  author_id: string;
  name: string;
  collaborators: CollaboratorEntry[];
  year: number;
  week: number;
}

/**
 * 선택된 주차들의 스냅샷 엔트리를 가져오는 hook
 */
export function useCollaborationData(
  workspaceId: string,
  selectedWeeks: Set<string>
) {
  const [entries, setEntries] = useState<SnapshotEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId || selectedWeeks.size === 0) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        // 선택된 주차를 year-week 형식으로 파싱
        const weekFilters = Array.from(selectedWeeks).map((weekKey) => {
          const [yearStr, weekStr] = weekKey.split("-");
          return {
            year: parseInt(yearStr, 10),
            week: weekStr,
          };
        });

        // 모든 주차의 스냅샷 가져오기
        const allEntries: SnapshotEntry[] = [];

        for (const { year, week } of weekFilters) {
          const { data: snapshots, error: snapshotError } = await supabase
            .from("snapshots")
            .select("id, year, week")
            .eq("workspace_id", workspaceId)
            .eq("year", year)
            .eq("week", week);

          if (snapshotError) {
            console.error("[useCollaborationData] Snapshot error:", snapshotError);
            continue;
          }

          if (!snapshots || snapshots.length === 0) {
            continue;
          }

          // 각 스냅샷의 엔트리 가져오기
          for (const snapshot of snapshots) {
            const { data: entries, error: entriesError } = await supabase
              .from("snapshot_entries")
              .select("id, author_id, name, collaborators")
              .eq("snapshot_id", snapshot.id);

            if (entriesError) {
              console.error("[useCollaborationData] Entries error:", entriesError);
              continue;
            }

            if (entries) {
              allEntries.push(
                ...entries.map((entry: any) => ({
                  ...entry,
                  year: snapshot.year,
                  week: snapshot.week,
                  collaborators: entry.collaborators || [],
                }))
              );
            }
          }
        }

        setEntries(allEntries);
      } catch (err) {
        console.error("[useCollaborationData] Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [workspaceId, selectedWeeks]);

  return { entries, isLoading, error };
}

