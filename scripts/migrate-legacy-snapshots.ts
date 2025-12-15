/**
 * Legacy JSON → Supabase Migration Script
 *
 * 레거시 주간 스냅샷 JSON을 Supabase로 마이그레이션
 *
 * 실행 방법:
 *   npx tsx scripts/migrate-legacy-snapshots.ts ./data/scrum/2025/2025-W49.json
 *   npx tsx scripts/migrate-legacy-snapshots.ts --all ./data/scrum/2025
 *   npx tsx scripts/migrate-legacy-snapshots.ts --dry-run ./data/scrum/2025/2025-W49.json
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// .env.local에서 환경변수 로드
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Service Role Key가 있으면 사용, 없으면 Anon Key 사용
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ SUPABASE_URL 또는 SUPABASE_KEY가 설정되지 않았습니다.");
  console.error("   .env.local 파일에 다음 환경변수를 설정하세요:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error(
    "   - SUPABASE_SERVICE_ROLE_KEY (또는 NEXT_PUBLIC_SUPABASE_ANON_KEY)"
  );
  process.exit(1);
}

const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 레거시 JSON 타입 정의
interface LegacyTask {
  title: string;
  progress: number;
}

interface LegacyCollaborator {
  name: string;
  relation?: string;
}

interface LegacyPastWeek {
  tasks: LegacyTask[];
  risk?: string[] | null;
  riskLevel?: number | null;
  collaborators?: LegacyCollaborator[];
}

interface LegacyThisWeek {
  tasks: string[];
}

interface LegacyItem {
  name: string;
  domain: string;
  project: string;
  module?: string;
  feature?: string;
  pastWeek: LegacyPastWeek;
  thisWeek: LegacyThisWeek;
}

interface LegacyWeeklyData {
  year: number;
  week: string; // "W49"
  weekStart: string; // "YYYY-MM-DD"
  weekEnd: string;
  schemaVersion?: number;
  items: LegacyItem[];
}

// 마이그레이션 통계
interface MigrationStats {
  snapshotsCreated: number;
  snapshotsSkipped: number;
  entriesCreated: number;
  entriesSkipped: number;
  errors: string[];
}

/**
 * 레거시 collaborators를 새 형식으로 변환
 * relation (단일 문자열) → relations (배열)
 */
function convertCollaborators(
  collaborators: LegacyCollaborator[] | undefined
): { name: string; relations: string[] }[] {
  if (!collaborators || collaborators.length === 0) {
    return [];
  }
  return collaborators.map((c) => ({
    name: c.name,
    relations: c.relation ? [c.relation] : [],
  }));
}

/**
 * 단일 JSON 파일 마이그레이션
 */
async function migrateFile(
  filePath: string,
  dryRun: boolean
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    snapshotsCreated: 0,
    snapshotsSkipped: 0,
    entriesCreated: 0,
    entriesSkipped: 0,
    errors: [],
  };

  console.log(`\n📂 파일 처리: ${filePath}`);

  // JSON 파일 읽기
  let data: LegacyWeeklyData;
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(fileContent);
  } catch (error) {
    stats.errors.push(`파일 읽기 실패: ${filePath} - ${error}`);
    return stats;
  }

  // 유효성 검사
  if (!data.year || !data.week || !data.weekStart || !data.items) {
    stats.errors.push(`유효하지 않은 형식: ${filePath}`);
    return stats;
  }

  console.log(
    `   📅 ${data.year}년 ${data.week} (${data.weekStart} ~ ${data.weekEnd})`
  );
  console.log(`   📊 ${data.items.length}개 항목`);

  // 작성자(name)별로 항목 그룹화
  const itemsByAuthor = new Map<string, LegacyItem[]>();
  for (const item of data.items) {
    if (!item.name) continue;
    const existing = itemsByAuthor.get(item.name) || [];
    existing.push(item);
    itemsByAuthor.set(item.name, existing);
  }

  const uniqueAuthors = Array.from(itemsByAuthor.keys());
  console.log(`   👥 작성자 수: ${uniqueAuthors.length}명`);

  if (dryRun) {
    console.log("   🔍 [DRY-RUN] 데이터베이스에 쓰지 않습니다.");
    console.log(`   📊 생성될 스냅샷: ${uniqueAuthors.length}개`);
    console.log(`   📊 생성될 엔트리: ${data.items.length}개`);

    // 변환 결과 샘플 출력
    if (data.items.length > 0) {
      const sampleItem = data.items[0];
      console.log("\n   샘플 변환 결과:");
      console.log(`     - name: ${sampleItem.name}`);
      console.log(`     - domain: ${sampleItem.domain}`);
      console.log(`     - project: ${sampleItem.project}`);
      console.log(
        `     - risks: ${JSON.stringify(sampleItem.pastWeek.risk || [])}`
      );
      console.log(
        `     - collaborators: ${JSON.stringify(
          convertCollaborators(sampleItem.pastWeek.collaborators)
        )}`
      );
    }

    stats.snapshotsCreated = uniqueAuthors.length;
    stats.entriesCreated = data.items.length;
    return stats;
  }

  // 각 작성자별로 스냅샷 생성 및 엔트리 연결
  for (const authorName of uniqueAuthors) {
    const authorItems = itemsByAuthor.get(authorName) || [];

    // 1. 기존 스냅샷 확인 (중복 방지: 주차 + 작성자)
    const { data: existingSnapshot, error: checkError } = await supabase
      .from("snapshots")
      .select("id")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("year", data.year)
      .eq("week", data.week)
      .eq("author_display_name", authorName)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = 결과 없음
      stats.errors.push(
        `스냅샷 조회 오류 (${authorName}): ${checkError.message}`
      );
      continue;
    }

    let snapshotId: string;

    if (existingSnapshot) {
      snapshotId = existingSnapshot.id;
      stats.snapshotsSkipped++;
    } else {
      // 2. 스냅샷 생성 (작성자별로 1개씩)
      const { data: newSnapshot, error: snapshotError } = await supabase
        .from("snapshots")
        .insert({
          workspace_id: DEFAULT_WORKSPACE_ID,
          year: data.year,
          week: data.week,
          week_start_date: data.weekStart,
          week_end_date: data.weekEnd,
          author_id: null, // 트리거가 나중에 채움
          author_display_name: authorName, // 트리거 연결용
        })
        .select("id")
        .single();

      if (snapshotError || !newSnapshot) {
        stats.errors.push(
          `스냅샷 생성 실패 (${authorName}): ${snapshotError?.message}`
        );
        continue;
      }

      snapshotId = newSnapshot.id;
      stats.snapshotsCreated++;
    }

    // 3. 해당 작성자의 엔트리 생성
    for (const item of authorItems) {
      // 필수 필드 검증
      if (!item.domain || !item.project) {
        stats.errors.push(
          `필수 필드 누락 (${authorName}): domain=${item.domain}, project=${item.project}`
        );
        continue;
      }

      // 기존 엔트리 확인 (중복 방지)
      const { data: existingEntry, error: entryCheckError } = await supabase
        .from("snapshot_entries")
        .select("id")
        .eq("snapshot_id", snapshotId)
        .eq("domain", item.domain)
        .eq("project", item.project)
        .eq("module", item.module || "")
        .eq("feature", item.feature || "")
        .single();

      if (entryCheckError && entryCheckError.code !== "PGRST116") {
        stats.errors.push(
          `엔트리 조회 오류 (${authorName}): ${entryCheckError.message}`
        );
        continue;
      }

      if (existingEntry) {
        stats.entriesSkipped++;
        continue;
      }

      // 엔트리 삽입 (author_id는 NULL, 트리거가 나중에 채움)
      const { error: insertError } = await supabase
        .from("snapshot_entries")
        .insert({
          snapshot_id: snapshotId,
          workspace_id: DEFAULT_WORKSPACE_ID,
          author_id: null, // 트리거가 나중에 채움
          author_display_name: authorName, // 트리거 연결용
          name: authorName,
          domain: item.domain,
          project: item.project,
          module: item.module || "",
          feature: item.feature || "",
          past_week: {
            tasks: item.pastWeek.tasks || [],
          },
          this_week: {
            tasks: item.thisWeek.tasks || [],
          },
          risks: item.pastWeek.risk || [],
          risk_level: item.pastWeek.riskLevel || 0,
          collaborators: convertCollaborators(item.pastWeek.collaborators),
        });

      if (insertError) {
        stats.errors.push(
          `엔트리 삽입 실패 (${authorName}): ${insertError.message}`
        );
        continue;
      }

      stats.entriesCreated++;
    }
  }

  console.log(
    `   📊 스냅샷: ${stats.snapshotsCreated} 생성, ${stats.snapshotsSkipped} 스킵`
  );
  console.log(
    `   📊 엔트리: ${stats.entriesCreated} 생성, ${stats.entriesSkipped} 스킵`
  );

  return stats;
}

/**
 * 디렉토리 내 모든 JSON 파일 마이그레이션
 */
async function migrateDirectory(
  dirPath: string,
  dryRun: boolean
): Promise<MigrationStats> {
  const totalStats: MigrationStats = {
    snapshotsCreated: 0,
    snapshotsSkipped: 0,
    entriesCreated: 0,
    entriesSkipped: 0,
    errors: [],
  };

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));
  console.log(`\n📁 디렉토리: ${dirPath}`);
  console.log(`   ${files.length}개 JSON 파일 발견`);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await migrateFile(filePath, dryRun);

    totalStats.snapshotsCreated += stats.snapshotsCreated;
    totalStats.snapshotsSkipped += stats.snapshotsSkipped;
    totalStats.entriesCreated += stats.entriesCreated;
    totalStats.entriesSkipped += stats.entriesSkipped;
    totalStats.errors.push(...stats.errors);
  }

  return totalStats;
}

/**
 * 메인 함수
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("사용법:");
    console.log("  npx tsx scripts/migrate-legacy-snapshots.ts <파일경로>");
    console.log(
      "  npx tsx scripts/migrate-legacy-snapshots.ts --all <디렉토리경로>"
    );
    console.log(
      "  npx tsx scripts/migrate-legacy-snapshots.ts --dry-run <파일경로>"
    );
    process.exit(0);
  }

  let dryRun = false;
  let migrateAll = false;
  let targetPath = args[args.length - 1];

  for (const arg of args) {
    if (arg === "--dry-run") dryRun = true;
    if (arg === "--all") migrateAll = true;
  }

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     Legacy JSON → Supabase Migration                       ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n🔧 Workspace ID: ${DEFAULT_WORKSPACE_ID}`);
  console.log(`🔧 Supabase URL: ${SUPABASE_URL}`);
  console.log(
    `🔧 Auth Mode: ${
      isServiceRole
        ? "Service Role Key (RLS bypass)"
        : "Anon Key (RLS enforced)"
    }`
  );
  console.log("ℹ️  author_id는 NULL로 저장됩니다.");
  console.log(
    "   → 새 사용자가 가입하면 trg_link_legacy_authors 트리거가 자동 연결합니다."
  );
  if (!isServiceRole) {
    console.log(
      "⚠️  Anon Key 사용 중: RLS 정책에 의해 마이그레이션이 차단될 수 있습니다."
    );
    console.log(
      "   SUPABASE_SERVICE_ROLE_KEY를 .env.local에 추가하는 것을 권장합니다."
    );
  }
  if (dryRun) {
    console.log("🔍 DRY-RUN 모드: 데이터베이스에 쓰지 않습니다.");
  }

  let stats: MigrationStats;

  if (migrateAll || fs.statSync(targetPath).isDirectory()) {
    stats = await migrateDirectory(targetPath, dryRun);
  } else {
    stats = await migrateFile(targetPath, dryRun);
  }

  // 결과 출력
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("📊 마이그레이션 결과:");
  console.log(
    `   스냅샷: ${stats.snapshotsCreated} 생성, ${stats.snapshotsSkipped} 스킵`
  );
  console.log(
    `   엔트리: ${stats.entriesCreated} 생성, ${stats.entriesSkipped} 스킵`
  );

  if (stats.errors.length > 0) {
    console.log(`\n❌ 오류 (${stats.errors.length}개):`);
    for (const error of stats.errors) {
      console.log(`   - ${error}`);
    }
  } else {
    console.log("\n✅ 오류 없이 완료되었습니다.");
  }
}

main().catch((error) => {
  console.error("❌ 마이그레이션 실패:", error);
  process.exit(1);
});
