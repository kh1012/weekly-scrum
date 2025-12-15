/**
 * 정적 data/ 디렉토리의 스냅샷 데이터를 Supabase로 마이그레이션하는 스크립트
 *
 * 사용법:
 *   npx tsx scripts/migrate-static-data-to-supabase.ts
 *
 * 환경변수 필요:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   DEFAULT_WORKSPACE_ID
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// .env.local 로드
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !DEFAULT_WORKSPACE_ID) {
  console.error("❌ 환경변수가 설정되지 않았습니다.");
  console.error("필요한 환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DEFAULT_WORKSPACE_ID");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface PastWeekTask {
  title: string;
  progress: number;
}

interface Collaborator {
  name: string;
  relation: "pair" | "pre" | "post";
  relations?: ("pair" | "pre" | "post")[];
}

interface SnapshotItem {
  name: string;
  domain: string;
  project: string;
  module?: string;
  feature?: string;
  pastWeek: {
    tasks: PastWeekTask[];
    risk: string[] | null;
    riskLevel: number | null;
    collaborators: Collaborator[];
  };
  thisWeek: {
    tasks: string[];
  };
}

interface SnapshotData {
  year: number;
  week: string;
  weekStart: string;
  weekEnd: string;
  schemaVersion: number;
  items: SnapshotItem[];
}

async function migrateSnapshots() {
  console.log("🚀 스냅샷 데이터 마이그레이션 시작...\n");

  const dataDir = path.join(process.cwd(), "data", "scrum");

  if (!fs.existsSync(dataDir)) {
    console.log("⚠️ data/scrum 디렉토리가 없습니다.");
    return;
  }

  const years = fs.readdirSync(dataDir).filter((f) =>
    fs.statSync(path.join(dataDir, f)).isDirectory()
  );

  let totalSnapshots = 0;
  let totalEntries = 0;

  for (const year of years) {
    const yearDir = path.join(dataDir, year);
    const files = fs.readdirSync(yearDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(yearDir, file);
      console.log(`📄 처리 중: ${filePath}`);

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const data: SnapshotData = JSON.parse(content);

        // 스냅샷 upsert (중복 방지)
        const snapshotKey = `${data.year}-${data.week}`;

        // 기존 스냅샷 확인
        const { data: existingSnapshot } = await supabase
          .from("snapshots")
          .select("id")
          .eq("workspace_id", DEFAULT_WORKSPACE_ID)
          .eq("year", data.year)
          .eq("week", data.week)
          .single();

        let snapshotId: string;

        if (existingSnapshot) {
          console.log(`  ↳ 기존 스냅샷 발견: ${snapshotKey}`);
          snapshotId = existingSnapshot.id;

          // 기존 엔트리 삭제 (재생성)
          await supabase
            .from("snapshot_entries")
            .delete()
            .eq("snapshot_id", snapshotId);
        } else {
          // 새 스냅샷 생성
          const { data: newSnapshot, error: snapshotError } = await supabase
            .from("snapshots")
            .insert({
              workspace_id: DEFAULT_WORKSPACE_ID,
              year: data.year,
              week: data.week,
              week_start_date: data.weekStart,
              week_end_date: data.weekEnd,
            })
            .select("id")
            .single();

          if (snapshotError) {
            console.error(`  ❌ 스냅샷 생성 실패:`, snapshotError.message);
            continue;
          }

          snapshotId = newSnapshot.id;
          totalSnapshots++;
          console.log(`  ✅ 스냅샷 생성: ${snapshotKey}`);
        }

        // 엔트리 생성
        const entries = data.items.map((item) => ({
          snapshot_id: snapshotId,
          name: item.name,
          domain: item.domain,
          project: item.project,
          module: item.module || null,
          feature: item.feature || null,
          past_week_tasks: item.pastWeek.tasks,
          this_week_tasks: item.thisWeek.tasks,
          risk: item.pastWeek.risk,
          risk_level: item.pastWeek.riskLevel,
          collaborators: item.pastWeek.collaborators,
        }));

        if (entries.length > 0) {
          const { error: entriesError } = await supabase
            .from("snapshot_entries")
            .insert(entries);

          if (entriesError) {
            console.error(`  ❌ 엔트리 생성 실패:`, entriesError.message);
          } else {
            totalEntries += entries.length;
            console.log(`  ✅ ${entries.length}개 엔트리 생성`);
          }
        }
      } catch (error) {
        console.error(`  ❌ 파일 처리 실패:`, error);
      }
    }
  }

  console.log("\n✨ 마이그레이션 완료!");
  console.log(`   - 스냅샷: ${totalSnapshots}개 생성`);
  console.log(`   - 엔트리: ${totalEntries}개 생성`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("📦 Supabase 데이터 마이그레이션 스크립트");
  console.log("=".repeat(60));
  console.log(`\n🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🏢 Workspace ID: ${DEFAULT_WORKSPACE_ID}\n`);

  try {
    await migrateSnapshots();
  } catch (error) {
    console.error("\n❌ 마이그레이션 실패:", error);
    process.exit(1);
  }
}

main();

