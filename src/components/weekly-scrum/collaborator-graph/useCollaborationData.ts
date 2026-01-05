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
            week: `W${weekStr}`, // DB에는 "W48" 형식으로 저장됨
          };
        });

        // 모든 주차의 스냅샷을 병렬로 가져오기
        const snapshotPromises = weekFilters.map(({ year, week }) =>
          supabase
            .from("snapshots")
            .select("id, year, week")
            .eq("workspace_id", workspaceId)
            .eq("year", year)
            .eq("week", week)
        );

        const snapshotResults = await Promise.all(snapshotPromises);

        // 모든 스냅샷 수집
        const allSnapshots: Array<{ id: string; year: number; week: string }> = [];
        snapshotResults.forEach(({ data: snapshots, error: snapshotError }) => {
          if (snapshotError) {
            console.error("[useCollaborationData] Snapshot error:", snapshotError);
            return;
          }
          if (snapshots && snapshots.length > 0) {
            allSnapshots.push(...snapshots);
          }
        });

        // 모든 스냅샷의 엔트리를 병렬로 가져오기
        const entryPromises = allSnapshots.map((snapshot) =>
          supabase
              .from("snapshot_entries")
              .select("id, author_id, name, collaborators")
            .eq("snapshot_id", snapshot.id)
            .then((result: { data: any[] | null; error: any }) => ({
              snapshot,
              entries: result.data,
              error: result.error,
            }))
        );

        const entryResults = await Promise.all(entryPromises);

        // 모든 엔트리 수집 및 변환
        const allEntries: SnapshotEntry[] = [];
        entryResults.forEach(({ snapshot, entries, error }) => {
          if (error) {
            console.error("[useCollaborationData] Entries error:", error);
            return;
            }

            if (entries) {
              // collaborators가 있는 엔트리만 추가
              const validEntries = entries
                .map((entry: any) => {
                  // collaborators 데이터 정규화
                  const rawCollaborators = entry.collaborators || [];
                  const normalizedCollaborators: CollaboratorEntry[] = [];

                  if (Array.isArray(rawCollaborators)) {
                    rawCollaborators.forEach((collab: any) => {
                      if (typeof collab === "string") {
                        // 문자열인 경우 (name만)
                        normalizedCollaborators.push({
                          name: collab,
                          relation: "pair",
                        });
                      } else if (collab && typeof collab === "object") {
                        const name = collab.name || collab.userName || "";
                        if (!name) return;

                        // relations 배열이 있는 경우
                        if (Array.isArray(collab.relations) && collab.relations.length > 0) {
                          collab.relations.forEach((relation: string) => {
                            if (["pair", "pre", "post"].includes(relation)) {
                              normalizedCollaborators.push({
                                name,
                                relation: relation as "pair" | "pre" | "post",
                              });
                            }
                          });
                        } else if (collab.relation && ["pair", "pre", "post"].includes(collab.relation)) {
                          // relation 단일 값인 경우
                          normalizedCollaborators.push({
                            name,
                            relation: collab.relation as "pair" | "pre" | "post",
                          });
                        } else {
                          // relation이 없는 경우 기본값 pair
                          normalizedCollaborators.push({
                            name,
                            relation: "pair",
                          });
                        }
                      }
                    });
                  }

                  return {
                    ...entry,
                    year: snapshot.year,
                    week: parseInt(snapshot.week.replace("W", ""), 10),
                    collaborators: normalizedCollaborators,
                  };
                })
                .filter(
                  (entry: any) =>
                    entry.collaborators &&
                    Array.isArray(entry.collaborators) &&
                    entry.collaborators.length > 0
                );

              allEntries.push(...validEntries);
            }
        });

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

