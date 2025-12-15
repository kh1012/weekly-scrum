/**
 * Supabase Database 타입 정의
 * - Supabase CLI로 자동 생성하거나 수동으로 정의
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
      };
      snapshots: {
        Row: {
          id: string;
          workspace_id: string;
          author_id: string | null;
          author_display_name: string | null;
          week_start_date: string;
          week_end_date: string | null;
          year: number | null;
          week: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          author_id?: string | null;
          author_display_name?: string | null;
          week_start_date: string;
          week_end_date?: string | null;
          year?: number | null;
          week?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          author_id?: string | null;
          author_display_name?: string | null;
          week_start_date?: string;
          week_end_date?: string | null;
          year?: number | null;
          week?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      snapshot_entries: {
        Row: {
          id: string;
          snapshot_id: string;
          workspace_id: string;
          author_id: string;
          name: string;
          domain: string;
          project: string;
          module: string;
          feature: string;
          past_week: PastWeekData;
          this_week: ThisWeekData;
          risk: RiskData;
          risks: string[];
          risk_level: number;
          collaborators: Collaborator[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          snapshot_id: string;
          workspace_id: string;
          author_id: string;
          name: string;
          domain: string;
          project: string;
          module: string;
          feature: string;
          past_week?: PastWeekData;
          this_week?: ThisWeekData;
          risk?: RiskData;
          risks?: string[];
          risk_level?: number;
          collaborators?: Collaborator[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          snapshot_id?: string;
          workspace_id?: string;
          author_id?: string;
          name?: string;
          domain?: string;
          project?: string;
          module?: string;
          feature?: string;
          past_week?: PastWeekData;
          this_week?: ThisWeekData;
          risk?: RiskData;
          risks?: string[];
          risk_level?: number;
          collaborators?: Collaborator[];
          created_at?: string;
          updated_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          description: string | null;
          start_date: string;
          end_date: string;
          status: "planned" | "in_progress" | "completed" | "cancelled";
          priority: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          status?: "planned" | "in_progress" | "completed" | "cancelled";
          priority?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          status?: "planned" | "in_progress" | "completed" | "cancelled";
          priority?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      plan_assignees: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      snapshot_weeks: {
        Row: {
          id: string;
          workspace_id: string;
          year: number;
          week: string;
          week_start_date: string;
          week_end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          year: number;
          week: string;
          week_start_date: string;
          week_end_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          year?: number;
          week?: string;
          week_start_date?: string;
          week_end_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// JSON 필드 타입
export interface PastWeekTask {
  title: string;
  progress: number;
}

export interface Collaborator {
  name: string;
  relation: "pair" | "pre" | "post";
  relations?: ("pair" | "pre" | "post")[];
}

// snapshot_entries의 jsonb 컬럼 타입
export interface PastWeekData {
  tasks?: PastWeekTask[];
  collaborators?: Collaborator[];
}

export interface ThisWeekData {
  tasks?: string[];
}

export interface RiskData {
  items?: string[];
}

