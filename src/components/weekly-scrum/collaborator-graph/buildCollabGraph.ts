import type { SnapshotEntry } from "./useCollaborationData";

export interface GraphNode {
  id: string;
  label: string;
  totalCollabs: number;
  uniquePartners: number;
  authoredCount: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  weeks: string[];
}

export interface GraphStats {
  selectedWeekRangeLabel: string;
  totalCollabWeight: number;
  participantCount: number;
  topCollaborator: GraphNode | null;
  top3Collaborators: GraphNode[];
  distributionData: {
    top1Share: number;
    top3Share: number;
    restShare: number;
  };
}

export interface CollabGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
}

/**
 * 스냅샷 엔트리들로부터 협업 그래프 데이터를 생성
 */
export function buildCollabGraph(
  entries: SnapshotEntry[],
  selectedWeeks: Set<string>
): CollabGraphData {
  if (entries.length === 0) {
    return {
      nodes: [],
      edges: [],
      stats: {
        selectedWeekRangeLabel: "선택된 주차 없음",
        totalCollabWeight: 0,
        participantCount: 0,
        topCollaborator: null,
        top3Collaborators: [],
        distributionData: {
          top1Share: 0,
          top3Share: 0,
          restShare: 0,
        },
      },
    };
  }

  // 1. 노드 데이터 수집 (author_id 기준)
  const nodeMap = new Map<
    string,
    {
      name: string;
      totalCollabs: number;
      partners: Set<string>;
      authoredCount: number;
    }
  >();

  // 2. 엣지 데이터 수집 (무방향 그래프)
  const edgeMap = new Map<
    string,
    {
      weight: number;
      weeks: Set<string>;
    }
  >();

  // 엔트리 순회하며 노드와 엣지 구성
  entries.forEach((entry) => {
    const authorId = entry.author_id;
    const authorName = entry.name;
    const weekKey = `${entry.year}-${entry.week}`;

    // 작성자 노드 초기화
    if (!nodeMap.has(authorId)) {
      nodeMap.set(authorId, {
        name: authorName,
        totalCollabs: 0,
        partners: new Set(),
        authoredCount: 0,
      });
    }

    const authorNode = nodeMap.get(authorId)!;
    authorNode.authoredCount += 1;

    // 협업자 처리
    entry.collaborators.forEach((collab) => {
      const collabName = collab.name;

      // 협업자 노드 초기화 (ID는 name으로 사용, 실제로는 user_id를 매핑해야 하지만 여기서는 name 사용)
      const collabId = collabName;

      if (!nodeMap.has(collabId)) {
        nodeMap.set(collabId, {
          name: collabName,
          totalCollabs: 0,
          partners: new Set(),
          authoredCount: 0,
        });
      }

      // 엣지 생성 (무방향)
      const edgeKey = getEdgeKey(authorId, collabId);

      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          weight: 0,
          weeks: new Set(),
        });
      }

      const edge = edgeMap.get(edgeKey)!;
      edge.weight += 1;
      edge.weeks.add(weekKey);

      // 노드 통계 업데이트
      authorNode.totalCollabs += 1;
      authorNode.partners.add(collabId);

      const collabNode = nodeMap.get(collabId)!;
      collabNode.totalCollabs += 1;
      collabNode.partners.add(authorId);
    });
  });

  // 3. 노드 배열 생성
  const nodes: GraphNode[] = Array.from(nodeMap.entries()).map(
    ([id, data]) => ({
      id,
      label: data.name,
      totalCollabs: data.totalCollabs,
      uniquePartners: data.partners.size,
      authoredCount: data.authoredCount,
    })
  );

  // 4. 엣지 배열 생성
  const edges: GraphEdge[] = Array.from(edgeMap.entries()).map(
    ([edgeKey, data]) => {
      const [source, target] = edgeKey.split(":");
      return {
        id: edgeKey,
        source,
        target,
        weight: data.weight,
        weeks: Array.from(data.weeks),
      };
    }
  );

  // 5. 통계 계산
  const totalCollabWeight = edges.reduce((sum, edge) => sum + edge.weight, 0);
  const participantCount = nodes.length;

  // Top 협업자 (totalCollabs 기준)
  const sortedNodes = [...nodes].sort(
    (a, b) => b.totalCollabs - a.totalCollabs
  );
  const topCollaborator = sortedNodes[0] || null;
  const top3Collaborators = sortedNodes.slice(0, 3);

  // 분포 계산
  const top1Share =
    totalCollabWeight > 0
      ? ((topCollaborator?.totalCollabs || 0) / totalCollabWeight) * 100
      : 0;
  const top3Total = top3Collaborators.reduce(
    (sum, node) => sum + node.totalCollabs,
    0
  );
  const top3Share =
    totalCollabWeight > 0 ? (top3Total / totalCollabWeight) * 100 : 0;
  const restShare = 100 - top3Share;

  // 주차 범위 라벨
  const weekArray = Array.from(selectedWeeks).sort();
  const selectedWeekRangeLabel =
    weekArray.length === 1
      ? weekArray[0]
      : weekArray.length > 1
      ? `${weekArray[0]} ~ ${weekArray[weekArray.length - 1]}`
      : "선택된 주차 없음";

  return {
    nodes,
    edges,
    stats: {
      selectedWeekRangeLabel,
      totalCollabWeight,
      participantCount,
      topCollaborator,
      top3Collaborators,
      distributionData: {
        top1Share,
        top3Share,
        restShare,
      },
    },
  };
}

/**
 * 무방향 엣지 키 생성 (작은 ID가 항상 앞에 오도록)
 */
function getEdgeKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
}

