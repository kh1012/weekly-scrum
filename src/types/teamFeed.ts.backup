/**
 * Team Activity Feed 타입 정의
 */

export interface PastWeekTask {
  title: string;
  progress?: number;
  note?: string;
}

export interface RiskItem {
  note?: string;
  title?: string;
  level?: string;
}

export interface TeamFeedEntry {
  id: string;
  snapshotId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: string | null;
  name: string;
  domain: string;
  project: string;
  module: string;
  feature: string;
  pastWeek: {
    tasks?: (string | PastWeekTask | any)[]; // 문자열 또는 객체 지원
  };
  thisWeek: {
    tasks?: (string | any)[]; // 문자열 또는 객체 지원
  };
  risks: (string | RiskItem | any)[]; // 문자열 또는 객체 지원
  riskLevel: number;
  collaborators: Array<{
    name: string;
    relation?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyHighlight {
  progress: string;
  next: string;
  risk: string;
}

export interface FeedItemData {
  personId: string;
  personName: string;
  personEmail: string;
  personRole: string | null;
  year: number;
  week: string;
  weekStartDate: string;
  weekEndDate: string;
  highlight: WeeklyHighlight;
  entries: TeamFeedEntry[];
  latestActivityDate: string;
}

export interface ActivityChartData {
  date: string;
  count: number;
  authorCount: number;
}

export interface TeamFeedData {
  feedItems: FeedItemData[];
  activityData: ActivityChartData[];
}
