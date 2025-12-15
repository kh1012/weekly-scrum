import { createClient } from "@/lib/supabase/server";
import { PersonalDashboard } from "@/components/weekly-scrum/my/PersonalDashboard";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export default async function MyPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let userName: string | undefined;
  let stats = {
    totalSnapshots: 0,
    thisWeekProgress: 0,
    activeProjects: 0,
    collaborators: 0,
  };

  if (user) {
    // 프로필에서 이름 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();
    
    userName = profile?.display_name;

    // 통계 조회
    const { data: snapshots } = await supabase
      .from("snapshots")
      .select("id")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("created_by", user.id);

    stats.totalSnapshots = snapshots?.length || 0;

    // 이번 주 스냅샷의 엔트리에서 진척률 계산
    const now = new Date();
    const jan4 = new Date(now.getFullYear(), 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
    const weekDiff = now.getTime() - firstMonday.getTime();
    const currentWeek = Math.ceil(weekDiff / (7 * 24 * 60 * 60 * 1000));
    const weekLabel = `W${currentWeek.toString().padStart(2, "0")}`;

    const { data: thisWeekSnapshots } = await supabase
      .from("snapshots")
      .select("id, entries:snapshot_entries(past_week_tasks)")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("created_by", user.id)
      .eq("year", now.getFullYear())
      .eq("week", weekLabel);

    if (thisWeekSnapshots && thisWeekSnapshots.length > 0) {
      let totalProgress = 0;
      let taskCount = 0;
      const projects = new Set<string>();
      const collaboratorNames = new Set<string>();

      for (const snapshot of thisWeekSnapshots) {
        for (const entry of snapshot.entries || []) {
          const tasks = entry.past_week_tasks as { title: string; progress: number }[] || [];
          for (const task of tasks) {
            totalProgress += task.progress;
            taskCount++;
          }
        }
      }

      stats.thisWeekProgress = taskCount > 0 ? Math.round(totalProgress / taskCount) : 0;

      // 프로젝트와 협업자 수는 전체 스냅샷에서 계산
      const { data: allEntries } = await supabase
        .from("snapshot_entries")
        .select("project, collaborators")
        .in("snapshot_id", snapshots?.map(s => s.id) || []);

      if (allEntries) {
        for (const entry of allEntries) {
          if (entry.project) projects.add(entry.project);
          const collabs = entry.collaborators as { name: string }[] || [];
          for (const c of collabs) {
            if (c.name) collaboratorNames.add(c.name);
          }
        }
      }

      stats.activeProjects = projects.size;
      stats.collaborators = collaboratorNames.size;
    }
  }

  return (
    <PersonalDashboard 
      userName={userName}
      stats={stats}
    />
  );
}
