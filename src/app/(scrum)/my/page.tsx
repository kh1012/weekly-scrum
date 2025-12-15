import { createClient } from "@/lib/supabase/server";
import { PersonalDashboard } from "@/components/weekly-scrum/my/PersonalDashboard";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export default async function MyPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let userName: string | undefined;
  let stats = {
    totalSnapshots: 0,
    totalEntries: 0,
    thisWeekProgress: 0,
    activeProjects: 0,
    activeModules: 0,
    activeFeatures: 0,
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

    // 통계 조회 - author_id 필드 사용
    const { data: snapshots } = await supabase
      .from("snapshots")
      .select("id")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("author_id", user.id);

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
      .select("id, entries:snapshot_entries(past_week)")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("author_id", user.id)
      .eq("year", now.getFullYear())
      .eq("week", weekLabel);

    // 프로젝트, 모듈, 기능, 협업자 수는 전체 스냅샷에서 계산
    const snapshotIds = snapshots?.map(s => s.id) || [];
    const { data: allEntries } = snapshotIds.length > 0 ? await supabase
      .from("snapshot_entries")
      .select("project, module, feature, collaborators, past_week")
      .in("snapshot_id", snapshotIds) : { data: [] };

    // 전체 엔트리 수
    stats.totalEntries = allEntries?.length || 0;

    const projects = new Set<string>();
    const modules = new Set<string>();
    const features = new Set<string>();
    const collaboratorNames = new Set<string>();
    let totalProgress = 0;
    let taskCount = 0;

    if (allEntries) {
      for (const entry of allEntries) {
        if (entry.project) projects.add(entry.project);
        if (entry.module) modules.add(entry.module);
        if (entry.feature) features.add(entry.feature);
        
        // collaborators에서 이름 추출
        const collabs = entry.collaborators as { name: string }[] || [];
        for (const c of collabs) {
          if (c.name) collaboratorNames.add(c.name);
        }

        // 진척률 계산 - past_week.tasks 사용
        const pastWeek = entry.past_week as { tasks?: { title: string; progress: number }[] } || {};
        const tasks = pastWeek.tasks || [];
        for (const task of tasks) {
          totalProgress += task.progress || 0;
          taskCount++;
        }
      }
    }

    // 이번 주 스냅샷의 진척률만 따로 계산
    if (thisWeekSnapshots && thisWeekSnapshots.length > 0) {
      let thisWeekTotal = 0;
      let thisWeekTaskCount = 0;

      for (const snapshot of thisWeekSnapshots) {
        for (const entry of snapshot.entries || []) {
          const pastWeek = entry.past_week as { tasks?: { title: string; progress: number }[] } || {};
          const tasks = pastWeek.tasks || [];
          for (const task of tasks) {
            thisWeekTotal += task.progress || 0;
            thisWeekTaskCount++;
          }
        }
      }

      stats.thisWeekProgress = thisWeekTaskCount > 0 ? Math.round(thisWeekTotal / thisWeekTaskCount) : 0;
    }

    stats.activeProjects = projects.size;
    stats.activeModules = modules.size;
    stats.activeFeatures = features.size;
    stats.collaborators = collaboratorNames.size;
  }

  return (
    <PersonalDashboard 
      userName={userName}
      stats={stats}
    />
  );
}
