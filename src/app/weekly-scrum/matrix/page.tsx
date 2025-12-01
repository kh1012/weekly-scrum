import * as fs from "fs";
import * as path from "path";
import type { WeeklyScrumData } from "@/types/scrum";
import { MatrixFullScreen } from "@/components/weekly-scrum/MatrixFullScreen";

function getAllScrumData(): Record<string, WeeklyScrumData> {
  const dataDir = path.join(process.cwd(), "data", "scrum");
  const allData: Record<string, WeeklyScrumData> = {};

  if (!fs.existsSync(dataDir)) {
    return {};
  }

  const years = fs
    .readdirSync(dataDir)
    .filter((f) => fs.statSync(path.join(dataDir, f)).isDirectory());

  for (const yearStr of years) {
    const yearDir = path.join(dataDir, yearStr);
    const months = fs
      .readdirSync(yearDir)
      .filter((f) => fs.statSync(path.join(yearDir, f)).isDirectory());

    for (const monthStr of months) {
      const monthDir = path.join(yearDir, monthStr);
      const files = fs.readdirSync(monthDir).filter((f) => f.endsWith(".json"));

      for (const file of files) {
        const filePath = path.join(monthDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content) as WeeklyScrumData;
        const key = `${data.year}-${data.month}-${data.week}`;
        allData[key] = data;
      }
    }
  }

  return allData;
}

export default function MatrixPage() {
  const allData = getAllScrumData();

  return <MatrixFullScreen allData={allData} />;
}

