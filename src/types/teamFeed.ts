/**
 * Team Activity Feed 타입 정의
 */

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
    tasks: string[];
  };
  thisWeek: {
    tasks: string[];
  };
  risks: string[];
  riskLevel: number;
  collaborators: Array<{
    id: string;
    name: string;
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

