import { createClient } from "@/lib/supabase/server";
import { PersonalDashboard } from "@/components/weekly-scrum/my/PersonalDashboard";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

/**
 * ISO 주차 계산 헬퍼
 */
function getISOWeekInfo(date: Date) {
  const jan4 = new Date(date.getFullYear(), 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
  const weekDiff = date.getTime() - firstMonday.getTime();
  const currentWeek = Math.ceil(weekDiff / (7 * 24 * 60 * 60 * 1000));
  return { year: date.getFullYear(), week: currentWeek };
}

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
  
  // 추세 데이터
  let trends = {
    snapshotsTrend: 0,
    entriesTrend: 0,
    progressTrend: 0,
    projectsTrend: 0,
    modulesTrend: 0,
    featuresTrend: 0,
    collaboratorsTrend: 0,
  };

  // 이번 주 스냅샷 존재 여부
  let hasCurrentWeekData = false;

  if (user) {
    // 프로필에서 이름 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();
    
    userName = profile?.display_name;

    // 현재 주차 정보
    const now = new Date();
    const { year: currentYear, week: currentWeek } = getISOWeekInfo(now);
    const currentWeekLabel = `W${currentWeek.toString().padStart(2, "0")}`;
    
    // 지난 주차 정보
    const lastWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { year: lastYear, week: lastWeek } = getISOWeekInfo(lastWeekDate);
    const lastWeekLabel = `W${lastWeek.toString().padStart(2, "0")}`;

    // 통계 조회 - author_id 필드 사용
    const { data: snapshots } = await supabase
      .from("snapshots")
      .select("id, year, week")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("author_id", user.id);

    stats.totalSnapshots = snapshots?.length || 0;

    // 이번 주 스냅샷
    const thisWeekSnapshots = snapshots?.filter(s => s.year === currentYear && s.week === currentWeekLabel) || [];
    // 지난 주 스냅샷
    const lastWeekSnapshots = snapshots?.filter(s => s.year === lastYear && s.week === lastWeekLabel) || [];
    
    // 스냅샷 추세 (이번 주 - 지난 주)
    trends.snapshotsTrend = thisWeekSnapshots.length - lastWeekSnapshots.length;
    
    // 이번 주 스냅샷 존재 여부 업데이트
    hasCurrentWeekData = thisWeekSnapshots.length > 0;

    // 프로젝트, 모듈, 기능, 협업자 수는 전체 스냅샷에서 계산
    const snapshotIds = snapshots?.map(s => s.id) || [];
    const { data: allEntries } = snapshotIds.length > 0 ? await supabase
      .from("snapshot_entries")
      .select("snapshot_id, project, module, feature, collaborators, past_week")
      .in("snapshot_id", snapshotIds) : { data: [] };

    // 전체 엔트리 수
    stats.totalEntries = allEntries?.length || 0;

    // 이번 주 / 지난 주 엔트리 분리
    const thisWeekSnapshotIds = new Set(thisWeekSnapshots.map(s => s.id));
    const lastWeekSnapshotIds = new Set(lastWeekSnapshots.map(s => s.id));
    
    const thisWeekEntries = allEntries?.filter(e => thisWeekSnapshotIds.has(e.snapshot_id)) || [];
    const lastWeekEntries = allEntries?.filter(e => lastWeekSnapshotIds.has(e.snapshot_id)) || [];
    
    // 엔트리 추세
    trends.entriesTrend = thisWeekEntries.length - lastWeekEntries.length;

    const projects = new Set<string>();
    const modules = new Set<string>();
    const features = new Set<string>();
    const collaboratorNames = new Set<string>();

    // 지난 주 통계
    const lastWeekProjects = new Set<string>();
    const lastWeekModules = new Set<string>();
    const lastWeekFeatures = new Set<string>();
    const lastWeekCollaborators = new Set<string>();
    let lastWeekProgressTotal = 0;
    let lastWeekTaskCount = 0;

    // 이번 주 통계
    const thisWeekProjects = new Set<string>();
    const thisWeekModules = new Set<string>();
    const thisWeekFeatures = new Set<string>();
    const thisWeekCollaborators = new Set<string>();
    let thisWeekProgressTotal = 0;
    let thisWeekTaskCount = 0;

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

        // 이번 주 엔트리 통계
        if (thisWeekSnapshotIds.has(entry.snapshot_id)) {
          if (entry.project) thisWeekProjects.add(entry.project);
          if (entry.module) thisWeekModules.add(entry.module);
          if (entry.feature) thisWeekFeatures.add(entry.feature);
          for (const c of collabs) {
            if (c.name) thisWeekCollaborators.add(c.name);
          }
          
          const pastWeek = entry.past_week as { tasks?: { title: string; progress: number }[] } || {};
          const tasks = pastWeek.tasks || [];
          for (const task of tasks) {
            thisWeekProgressTotal += task.progress || 0;
            thisWeekTaskCount++;
          }
        }
        
        // 지난 주 엔트리 통계
        if (lastWeekSnapshotIds.has(entry.snapshot_id)) {
          if (entry.project) lastWeekProjects.add(entry.project);
          if (entry.module) lastWeekModules.add(entry.module);
          if (entry.feature) lastWeekFeatures.add(entry.feature);
          for (const c of collabs) {
            if (c.name) lastWeekCollaborators.add(c.name);
          }
          
          const pastWeek = entry.past_week as { tasks?: { title: string; progress: number }[] } || {};
          const tasks = pastWeek.tasks || [];
          for (const task of tasks) {
            lastWeekProgressTotal += task.progress || 0;
            lastWeekTaskCount++;
          }
        }
      }
    }

    // 이번 주 진척률
    stats.thisWeekProgress = thisWeekTaskCount > 0 ? Math.round(thisWeekProgressTotal / thisWeekTaskCount) : 0;
    
    // 지난 주 진척률
    const lastWeekProgress = lastWeekTaskCount > 0 ? Math.round(lastWeekProgressTotal / lastWeekTaskCount) : 0;
    
    // 진척률 추세
    trends.progressTrend = stats.thisWeekProgress - lastWeekProgress;

    // 프로젝트/모듈/기능/협업자 추세
    trends.projectsTrend = thisWeekProjects.size - lastWeekProjects.size;
    trends.modulesTrend = thisWeekModules.size - lastWeekModules.size;
    trends.featuresTrend = thisWeekFeatures.size - lastWeekFeatures.size;
    trends.collaboratorsTrend = thisWeekCollaborators.size - lastWeekCollaborators.size;

    stats.activeProjects = projects.size;
    stats.activeModules = modules.size;
    stats.activeFeatures = features.size;
    stats.collaborators = collaboratorNames.size;
  }

  return (
    <PersonalDashboard 
      userName={userName}
      stats={stats}
      trends={trends}
      hasCurrentWeekData={hasCurrentWeekData}
    />
  );
}
