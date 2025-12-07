"use client";

import type { ScrumItem, Relation } from "@/types/scrum";

interface CollaborationTarget {
  name: string;
  relation: Relation;
  topic: string;
  project: string;
}

interface MyCollaborationStatusProps {
  /** 나를 기다리고 있는 사람들 (다른 사람 항목 중 나를 waiting-on으로 지정한 경우) */
  waitingForMe: CollaborationTarget[];
  /** 내가 기다리는 사람들 (내 항목에서 waiting-on으로 지정한 사람) */
  iAmWaitingFor: CollaborationTarget[];
  /** 내 협업자 목록 */
  myCollaborators: CollaborationTarget[];
}

const RELATION_LABELS: Record<Relation, { label: string; color: string }> = {
  pair: { label: "페어", color: "var(--notion-blue)" },
  "waiting-on": { label: "대기", color: "var(--notion-orange)" },
  review: { label: "리뷰", color: "var(--notion-purple)" },
  handoff: { label: "인수", color: "var(--notion-green)" },
};

export function MyCollaborationStatus({
  waitingForMe,
  iAmWaitingFor,
  myCollaborators,
}: MyCollaborationStatusProps) {
  const hasAnyCollaboration =
    waitingForMe.length > 0 || iAmWaitingFor.length > 0 || myCollaborators.length > 0;

  if (!hasAnyCollaboration) {
    return null;
  }

  return (
    <div className="notion-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: "var(--notion-text-secondary)" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="text-base font-semibold" style={{ color: "var(--notion-text)" }}>
          내 협업 상태
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 나를 기다리는 사람들 */}
        <div className="space-y-2">
          <h4
            className="text-sm font-medium flex items-center gap-1.5"
            style={{ color: "var(--notion-orange)" }}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            나를 기다리는 사람 ({waitingForMe.length})
          </h4>
          {waitingForMe.length > 0 ? (
            <div className="space-y-1.5">
              {waitingForMe.map((item, idx) => (
                <CollaborationItem key={idx} item={item} showRelation={false} />
              ))}
            </div>
          ) : (
            <p className="text-xs py-2" style={{ color: "var(--notion-text-tertiary)" }}>
              대기 중인 항목 없음
            </p>
          )}
        </div>

        {/* 내가 기다리는 사람들 */}
        <div className="space-y-2">
          <h4
            className="text-sm font-medium flex items-center gap-1.5"
            style={{ color: "var(--notion-blue)" }}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            내가 기다리는 사람 ({iAmWaitingFor.length})
          </h4>
          {iAmWaitingFor.length > 0 ? (
            <div className="space-y-1.5">
              {iAmWaitingFor.map((item, idx) => (
                <CollaborationItem key={idx} item={item} showRelation={false} />
              ))}
            </div>
          ) : (
            <p className="text-xs py-2" style={{ color: "var(--notion-text-tertiary)" }}>
              대기 중인 항목 없음
            </p>
          )}
        </div>
      </div>

      {/* 기타 협업자 */}
      {myCollaborators.filter((c) => c.relation !== "waiting-on").length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--notion-border)" }}>
          <h4
            className="text-sm font-medium mb-2"
            style={{ color: "var(--notion-text-secondary)" }}
          >
            현재 협업 중
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {myCollaborators
              .filter((c) => c.relation !== "waiting-on")
              .map((item, idx) => {
                const config = RELATION_LABELS[item.relation];
                return (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${config.color}15`,
                      color: config.color,
                    }}
                    title={`${item.topic} (${item.project})`}
                  >
                    {item.name} ({config.label})
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function CollaborationItem({
  item,
  showRelation = true,
}: {
  item: CollaborationTarget;
  showRelation?: boolean;
}) {
  const config = RELATION_LABELS[item.relation];
  return (
    <div
      className="flex items-center justify-between p-2 rounded"
      style={{ backgroundColor: "var(--notion-bg-secondary)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium" style={{ color: "var(--notion-text)" }}>
          {item.name}
        </span>
        {showRelation && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            {config.label}
          </span>
        )}
      </div>
      <div className="text-xs truncate max-w-[50%]" style={{ color: "var(--notion-text-tertiary)" }}>
        {item.project} / {item.topic}
      </div>
    </div>
  );
}

/**
 * 협업 상태 데이터 계산
 */
export function calculateCollaborationStatus(
  memberItems: ScrumItem[],
  allItems: ScrumItem[],
  memberName: string
): {
  waitingForMe: CollaborationTarget[];
  iAmWaitingFor: CollaborationTarget[];
  myCollaborators: CollaborationTarget[];
} {
  // 나를 waiting-on으로 지정한 다른 사람들
  const waitingForMe: CollaborationTarget[] = [];
  allItems.forEach((item) => {
    if (item.name === memberName) return;
    if (!item.collaborators) return;

    item.collaborators.forEach((collab) => {
      if (collab.name === memberName && collab.relation === "waiting-on") {
        waitingForMe.push({
          name: item.name,
          relation: collab.relation,
          topic: item.topic,
          project: item.project,
        });
      }
    });
  });

  // 내가 waiting-on으로 지정한 사람들
  const iAmWaitingFor: CollaborationTarget[] = [];
  memberItems.forEach((item) => {
    if (!item.collaborators) return;

    item.collaborators.forEach((collab) => {
      if (collab.relation === "waiting-on") {
        iAmWaitingFor.push({
          name: collab.name,
          relation: collab.relation,
          topic: item.topic,
          project: item.project,
        });
      }
    });
  });

  // 내 항목의 모든 협업자
  const myCollaborators: CollaborationTarget[] = [];
  memberItems.forEach((item) => {
    if (!item.collaborators) return;

    item.collaborators.forEach((collab) => {
      myCollaborators.push({
        name: collab.name,
        relation: collab.relation,
        topic: item.topic,
        project: item.project,
      });
    });
  });

  return { waitingForMe, iAmWaitingFor, myCollaborators };
}

