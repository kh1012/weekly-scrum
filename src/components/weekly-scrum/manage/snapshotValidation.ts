import type { TempSnapshot } from "./types";

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
}

export function validateSnapshot(snapshot: TempSnapshot): ValidationResult {
  const missingFields: string[] = [];

  if (!snapshot.domain || snapshot.domain.trim() === "") {
    missingFields.push("Domain");
  }

  if (!snapshot.project || snapshot.project.trim() === "") {
    missingFields.push("Project");
  }

  if (!snapshot.module || snapshot.module.trim() === "") {
    missingFields.push("Module");
  }

  if (!snapshot.feature || snapshot.feature.trim() === "") {
    missingFields.push("Feature");
  }

  if (!snapshot.pastWeek.tasks || snapshot.pastWeek.tasks.length === 0) {
    missingFields.push("PROGRESS.Tasks");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

export function validateSnapshots(snapshots: TempSnapshot[]): ValidationResult {
  const allMissingFields = new Set<string>();

  for (const snapshot of snapshots) {
    const result = validateSnapshot(snapshot);
    result.missingFields.forEach((field) => allMissingFields.add(field));
  }

  return {
    isValid: allMissingFields.size === 0,
    missingFields: Array.from(allMissingFields),
  };
}

export function formatMissingFieldsMessage(missingFields: string[]): string {
  return `필수 값이 누락되었습니다. ${missingFields.join(", ")}`;
}
