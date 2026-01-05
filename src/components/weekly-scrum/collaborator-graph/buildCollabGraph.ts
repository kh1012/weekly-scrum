import type { SnapshotEntry } from "./useCollaborationData";

export interface GraphNode {
  id: string;
  label: string;
  totalCollabs: number;
  uniquePartners: number;
  authoredCount: number;
  pairCount: number;
  preCount: number;
  postCount: number;
  // 방향성 구분
  outgoingCount: number; // 내가 지정함 (→)
  incomingCount: number; // 지정됨 (←)
  pairOutgoing: number;
  pairIncoming: number;
  preOutgoing: number;
  preIncoming: number;
  postOutgoing: number;
  postIncoming: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  weeks: string[];
  relations: Array<"pair" | "pre" | "post">;
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
      pairCount: number;
      preCount: number;
      postCount: number;
      outgoingCount: number;
      incomingCount: number;
      pairOutgoing: number;
      pairIncoming: number;
      preOutgoing: number;
      preIncoming: number;
      postOutgoing: number;
      postIncoming: number;
    }
  >();

  // 2. 엣지 데이터 수집 (무방향 그래프)
  const edgeMap = new Map<
    string,
    {
      weight: number;
      weeks: Set<string>;
      relations: Set<"pair" | "pre" | "post">;
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
        pairCount: 0,
        preCount: 0,
        postCount: 0,
        outgoingCount: 0,
        incomingCount: 0,
        pairOutgoing: 0,
        pairIncoming: 0,
        preOutgoing: 0,
        preIncoming: 0,
        postOutgoing: 0,
        postIncoming: 0,
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
          pairCount: 0,
          preCount: 0,
          postCount: 0,
          outgoingCount: 0,
          incomingCount: 0,
          pairOutgoing: 0,
          pairIncoming: 0,
          preOutgoing: 0,
          preIncoming: 0,
          postOutgoing: 0,
          postIncoming: 0,
        });
      }

      // 엣지 생성 (무방향)
      const edgeKey = getEdgeKey(authorId, collabId);

      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          weight: 0,
          weeks: new Set(),
          relations: new Set(),
        });
      }

      const edge = edgeMap.get(edgeKey)!;
      edge.weight += 1;
      edge.weeks.add(weekKey);
      edge.relations.add(collab.relation);

      // 노드 통계 업데이트
      authorNode.totalCollabs += 1;
      authorNode.partners.add(collabId);
      
      // 방향성: 작성자가 협업자를 지정 (outgoing)
      authorNode.outgoingCount += 1;
      
      // 관계별 카운트 업데이트 (작성자 기준 - outgoing)
      if (collab.relation === "pair") {
        authorNode.pairCount += 1;
        authorNode.pairOutgoing += 1;
      } else if (collab.relation === "pre") {
        authorNode.preCount += 1;
        authorNode.preOutgoing += 1;
      } else if (collab.relation === "post") {
        authorNode.postCount += 1;
        authorNode.postOutgoing += 1;
      }

      const collabNode = nodeMap.get(collabId)!;
      collabNode.totalCollabs += 1;
      collabNode.partners.add(authorId);
      
      // 방향성: 협업자가 지정됨 (incoming)
      collabNode.incomingCount += 1;
      
      // 관계별 카운트 업데이트 (협업자 기준 - incoming, 반대 관계)
      if (collab.relation === "pair") {
        collabNode.pairCount += 1;
        collabNode.pairIncoming += 1;
      } else if (collab.relation === "pre") {
        // 작성자가 pre라면 협업자는 post
        collabNode.postCount += 1;
        collabNode.postIncoming += 1;
      } else if (collab.relation === "post") {
        // 작성자가 post라면 협업자는 pre
        collabNode.preCount += 1;
        collabNode.preIncoming += 1;
      }
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
      pairCount: data.pairCount,
      preCount: data.preCount,
      postCount: data.postCount,
      outgoingCount: data.outgoingCount,
      incomingCount: data.incomingCount,
      pairOutgoing: data.pairOutgoing,
      pairIncoming: data.pairIncoming,
      preOutgoing: data.preOutgoing,
      preIncoming: data.preIncoming,
      postOutgoing: data.postOutgoing,
      postIncoming: data.postIncoming,
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
        relations: Array.from(data.relations),
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

