/**
 * Feedback 관련 타입 정의
 */

export type FeedbackStatus = "open" | "in_progress" | "resolved";

export interface Release {
  id: string;
  version: string;
  title: string;
  note?: string | null;
  released_at: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  author_user_id: string;
  title?: string | null;
  content: string;
  status: FeedbackStatus;
  resolved_release_id?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface FeedbackWithAuthor extends Feedback {
  author_name: string;
  author_email?: string;
}

export interface FeedbackWithDetails extends FeedbackWithAuthor {
  release_version?: string;
  release_title?: string;
}

