import type { ScrumItem, RiskLevel } from "@/types/scrum";
import type { ProjectNode, ModuleNode, FeatureNode } from "./types";

/**
 * 메트릭 타입
 */
export interface Metrics {
  progress: number; // 0-100
  riskLevel: RiskLevel | null; // 최대 리스크 레벨
  taskCount: number;
  completedTaskCount: number;
}

/**
 * Feature 레벨 메트릭 계산
 * - progress: 해당 feature의 pastWeek.tasks 평균
 * - riskLevel: pastWeek.riskLevel의 최대값 (없으면 null)
 */
export function computeFeatureMetrics(feature: FeatureNode): Metrics {
  const items = feature.items;

  if (items.length === 0) {
    return { progress: 0, riskLevel: null, taskCount: 0, completedTaskCount: 0 };
  }

  // progressPercent 평균 계산
  const totalProgress = items.reduce((sum, item) => sum + item.progressPercent, 0);
  const avgProgress = Math.round(totalProgress / items.length);

  // 최대 riskLevel 계산
  let maxRiskLevel: RiskLevel | null = null;
  for (const item of items) {
    if (item.riskLevel !== null) {
      if (maxRiskLevel === null || item.riskLevel > maxRiskLevel) {
        maxRiskLevel = item.riskLevel as RiskLevel;
      }
    }
  }

  // 태스크 수 계산
  const taskCount = items.reduce(
    (sum, item) => sum + item.progress.length,
    0
  );

  // 완료된 태스크 수 (100%)
  const completedTaskCount = items.reduce(
    (sum, item) =>
      sum + item.progress.filter((p) => p.includes("100%")).length,
    0
  );

  return {
    progress: avgProgress,
    riskLevel: maxRiskLevel,
    taskCount,
    completedTaskCount,
  };
}

/**
 * Module 레벨 메트릭 계산
 * - progress: 모듈에 속한 모든 feature progress 평균
 * - riskLevel: feature riskLevel 중 최대값
 */
export function computeModuleMetrics(module: ModuleNode): Metrics {
  const features = module.features;

  if (features.length === 0) {
    return { progress: 0, riskLevel: null, taskCount: 0, completedTaskCount: 0 };
  }

  const featureMetrics = features.map(computeFeatureMetrics);

  // progress 평균
  const totalProgress = featureMetrics.reduce((sum, m) => sum + m.progress, 0);
  const avgProgress = Math.round(totalProgress / featureMetrics.length);

  // 최대 riskLevel
  let maxRiskLevel: RiskLevel | null = null;
  for (const m of featureMetrics) {
    if (m.riskLevel !== null) {
      if (maxRiskLevel === null || m.riskLevel > maxRiskLevel) {
        maxRiskLevel = m.riskLevel;
      }
    }
  }

  // 태스크 합산
  const taskCount = featureMetrics.reduce((sum, m) => sum + m.taskCount, 0);
  const completedTaskCount = featureMetrics.reduce(
    (sum, m) => sum + m.completedTaskCount,
    0
  );

  return {
    progress: avgProgress,
    riskLevel: maxRiskLevel,
    taskCount,
    completedTaskCount,
  };
}

/**
 * Project 레벨 메트릭 계산
 * - progress: 프로젝트에 속한 모든 module progress 평균
 * - riskLevel: module riskLevel 중 최대값
 */
export function computeProjectMetrics(project: ProjectNode): Metrics {
  const modules = project.modules;

  if (modules.length === 0) {
    return { progress: 0, riskLevel: null, taskCount: 0, completedTaskCount: 0 };
  }

  const moduleMetrics = modules.map(computeModuleMetrics);

  // progress 평균
  const totalProgress = moduleMetrics.reduce((sum, m) => sum + m.progress, 0);
  const avgProgress = Math.round(totalProgress / moduleMetrics.length);

  // 최대 riskLevel
  let maxRiskLevel: RiskLevel | null = null;
  for (const m of moduleMetrics) {
    if (m.riskLevel !== null) {
      if (maxRiskLevel === null || m.riskLevel > maxRiskLevel) {
        maxRiskLevel = m.riskLevel;
      }
    }
  }

  // 태스크 합산
  const taskCount = moduleMetrics.reduce((sum, m) => sum + m.taskCount, 0);
  const completedTaskCount = moduleMetrics.reduce(
    (sum, m) => sum + m.completedTaskCount,
    0
  );

  return {
    progress: avgProgress,
    riskLevel: maxRiskLevel,
    taskCount,
    completedTaskCount,
  };
}

/**
 * Items로부터 직접 메트릭 계산
 */
export function computeItemsMetrics(items: ScrumItem[]): Metrics {
  if (items.length === 0) {
    return { progress: 0, riskLevel: null, taskCount: 0, completedTaskCount: 0 };
  }

  // progressPercent 평균 계산
  const totalProgress = items.reduce((sum, item) => sum + item.progressPercent, 0);
  const avgProgress = Math.round(totalProgress / items.length);

  // 최대 riskLevel 계산
  let maxRiskLevel: RiskLevel | null = null;
  for (const item of items) {
    if (item.riskLevel !== null) {
      if (maxRiskLevel === null || item.riskLevel > maxRiskLevel) {
        maxRiskLevel = item.riskLevel as RiskLevel;
      }
    }
  }

  // 태스크 수 계산
  const taskCount = items.reduce(
    (sum, item) => sum + item.progress.length,
    0
  );

  // 완료된 태스크 수 (100%)
  const completedTaskCount = items.reduce(
    (sum, item) =>
      sum + item.progress.filter((p) => p.includes("100%")).length,
    0
  );

  return {
    progress: avgProgress,
    riskLevel: maxRiskLevel,
    taskCount,
    completedTaskCount,
  };
}

