"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getCollaborationNodes, getCollaborationEdges } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CollaborationNetworkGraphProps {
  items: ScrumItem[];
}

interface Node3D {
  id: string;
  name: string;
  domain: string;
  degree: number;
  pairCount: number;
  waitingOnInbound: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export function CollaborationNetworkGraph({ items }: CollaborationNetworkGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(15);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const { rawNodes, edges } = useMemo(() => {
    const rawNodes = getCollaborationNodes(items);
    const edges = getCollaborationEdges(items);
    return { rawNodes, edges };
  }, [items]);

  // Force-directed layout with 3D positions
  const [nodes3D, setNodes3D] = useState<Node3D[]>([]);

  useEffect(() => {
    if (rawNodes.length === 0) return;

    // Initialize nodes in a sphere
    const initialNodes: Node3D[] = rawNodes.map((node, index) => {
      const phi = Math.acos(-1 + (2 * index) / rawNodes.length);
      const theta = Math.sqrt(rawNodes.length * Math.PI) * phi;
      const radius = 120;
      
      return {
        id: node.id,
        name: node.name,
        domain: node.domain,
        degree: node.degree,
        pairCount: node.pairCount,
        waitingOnInbound: node.waitingOnInbound,
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
        vx: 0,
        vy: 0,
        vz: 0,
      };
    });

    // Simple force simulation
    const simulate = (nodes: Node3D[], iterations: number): Node3D[] => {
      const result = nodes.map((n) => ({ ...n }));
      
      for (let iter = 0; iter < iterations; iter++) {
        // Repulsion between all nodes
        for (let i = 0; i < result.length; i++) {
          for (let j = i + 1; j < result.length; j++) {
            const dx = result[j].x - result[i].x;
            const dy = result[j].y - result[i].y;
            const dz = result[j].z - result[i].z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
            const force = 2000 / (dist * dist);
            
            result[i].vx -= (dx / dist) * force;
            result[i].vy -= (dy / dist) * force;
            result[i].vz -= (dz / dist) * force;
            result[j].vx += (dx / dist) * force;
            result[j].vy += (dy / dist) * force;
            result[j].vz += (dz / dist) * force;
          }
        }

        // Attraction along edges
        edges.forEach((edge) => {
          const source = result.find((n) => n.name === edge.source);
          const target = result.find((n) => n.name === edge.target);
          if (!source || !target) return;
          
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dz = target.z - source.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
          const force = dist * 0.02;
          
          source.vx += (dx / dist) * force;
          source.vy += (dy / dist) * force;
          source.vz += (dz / dist) * force;
          target.vx -= (dx / dist) * force;
          target.vy -= (dy / dist) * force;
          target.vz -= (dz / dist) * force;
        });

        // Apply velocity with damping
        result.forEach((node) => {
          node.x += node.vx * 0.1;
          node.y += node.vy * 0.1;
          node.z += node.vz * 0.1;
          node.vx *= 0.9;
          node.vy *= 0.9;
          node.vz *= 0.9;
        });
      }

      return result;
    };

    const simulated = simulate(initialNodes, 100);
    setNodes3D(simulated);
  }, [rawNodes, edges]);

  // Auto rotation
  useEffect(() => {
    if (!isAutoRotating || isDragging) return;
    
    const animate = () => {
      setRotationY((prev) => prev + 0.3);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAutoRotating, isDragging]);

  // Project 3D to 2D
  const project = useCallback((x: number, y: number, z: number) => {
    const radY = (rotationY * Math.PI) / 180;
    const radX = (rotationX * Math.PI) / 180;
    
    // Rotate around Y axis
    const x1 = x * Math.cos(radY) - z * Math.sin(radY);
    const z1 = x * Math.sin(radY) + z * Math.cos(radY);
    
    // Rotate around X axis
    const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);
    
    // Perspective projection
    const perspective = 400;
    const scale = perspective / (perspective + z2);
    
    return {
      x: 200 + x1 * scale,
      y: 200 + y2 * scale,
      z: z2,
      scale,
    };
  }, [rotationY, rotationX]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotationY((prev) => prev + dx * 0.5);
    setRotationX((prev) => Math.max(-60, Math.min(60, prev + dy * 0.3)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "#888";
  };

  const getNodeRadius = (degree: number) => {
    const minRadius = 14;
    const maxRadius = 28;
    const maxDegree = Math.max(...nodes3D.map((n) => n.degree), 1);
    return minRadius + ((maxRadius - minRadius) * degree) / maxDegree;
  };

  const activeNode = selectedNode ?? hoveredNode;
  const activeConnections = useMemo(() => {
    if (!activeNode) return new Set<string>();
    const connected = edges
      .filter((e) => e.source === activeNode || e.target === activeNode)
      .flatMap((e) => [e.source, e.target]);
    return new Set(connected);
  }, [activeNode, edges]);

  // Sort nodes by z for proper rendering order
  const sortedNodes = useMemo(() => {
    return [...nodes3D]
      .map((node) => ({
        ...node,
        projected: project(node.x, node.y, node.z),
      }))
      .sort((a, b) => a.projected.z - b.projected.z);
  }, [nodes3D, project]);

  if (rawNodes.length === 0) {
    return (
      <div className="notion-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
          🔗 협업 네트워크 (3D)
        </h3>
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          협업 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
          🔗 협업 네트워크 (3D)
        </h3>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--notion-text-secondary)" }}>
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className="px-2 py-1 rounded"
            style={{
              background: isAutoRotating ? "var(--notion-blue)" : "var(--notion-bg-secondary)",
              color: isAutoRotating ? "white" : "var(--notion-text-secondary)",
            }}
          >
            {isAutoRotating ? "⏸ 정지" : "▶ 회전"}
          </button>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded" style={{ background: "var(--notion-blue)" }} />
            pair
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded" style={{ background: "var(--notion-red)" }} />
            waiting-on
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative cursor-grab active:cursor-grabbing select-none"
        style={{
          height: 400,
          background: "radial-gradient(ellipse at center, var(--notion-bg-secondary) 0%, var(--notion-bg) 100%)",
          borderRadius: 8,
          overflow: "hidden",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 400"
          style={{ transform: "translateZ(0)" }}
        >
          {/* 3D Grid Floor Effect */}
          <defs>
            <linearGradient id="gridFade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--notion-border)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--notion-border)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--notion-border)" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map((edge, idx) => {
            const sourceNode = nodes3D.find((n) => n.name === edge.source);
            const targetNode = nodes3D.find((n) => n.name === edge.target);
            if (!sourceNode || !targetNode) return null;

            const source = project(sourceNode.x, sourceNode.y, sourceNode.z);
            const target = project(targetNode.x, targetNode.y, targetNode.z);

            const isActive = !activeNode || activeConnections.has(edge.source);
            const opacity = activeNode ? (isActive ? 0.8 : 0.08) : 0.4;
            const baseWidth = Math.min(edge.count * 1.5 + 1, 4);
            const avgScale = (source.scale + target.scale) / 2;
            const strokeWidth = baseWidth * avgScale;
            const color = edge.relation === "pair" ? "#3b82f6" : "#ef4444";

            // Curved edge with control point
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const offset = Math.min(20 * avgScale, 30);
            const controlX = midX + (Math.random() - 0.5) * offset;
            const controlY = midY + (Math.random() - 0.5) * offset;

            return (
              <g key={idx}>
                <path
                  d={`M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  strokeLinecap="round"
                  filter={isActive && activeNode ? "url(#glow)" : undefined}
                />
              </g>
            );
          })}

          {/* Nodes (sorted by z-depth) */}
          {sortedNodes.map((node) => {
            const { x, y, scale } = node.projected;
            const isActive = !activeNode || activeConnections.has(node.name) || node.name === activeNode;
            const opacity = activeNode ? (isActive ? 1 : 0.15) : 1;
            const radius = getNodeRadius(node.degree) * scale;
            const color = getDomainColor(node.domain);
            const isSelected = node.name === activeNode;

            return (
              <g
                key={node.id}
                transform={`translate(${x},${y})`}
                style={{
                  cursor: "pointer",
                  opacity,
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={() => setHoveredNode(node.name)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(selectedNode === node.name ? null : node.name);
                }}
              >
                {/* Glow effect for active node */}
                {isSelected && (
                  <circle
                    r={radius + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    opacity={0.5}
                    filter="url(#glow)"
                  />
                )}
                {/* Shadow */}
                <ellipse
                  cx={2}
                  cy={radius + 3}
                  rx={radius * 0.8}
                  ry={radius * 0.3}
                  fill="rgba(0,0,0,0.15)"
                />
                {/* Main sphere gradient effect */}
                <circle
                  r={radius}
                  fill={color}
                  stroke={isSelected ? "white" : "rgba(255,255,255,0.3)"}
                  strokeWidth={isSelected ? 2.5 : 1}
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                  }}
                />
                {/* Highlight */}
                <circle
                  r={radius * 0.7}
                  cx={-radius * 0.25}
                  cy={-radius * 0.25}
                  fill="url(#sphereHighlight)"
                  opacity={0.4}
                />
                {/* Name label */}
                <text
                  y={radius + 12 * scale}
                  textAnchor="middle"
                  fontSize={Math.max(9, 10 * scale)}
                  fill="var(--notion-text)"
                  fontWeight={isSelected ? 700 : 500}
                  style={{
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    pointerEvents: "none",
                  }}
                >
                  {node.name}
                </text>
              </g>
            );
          })}

          {/* Sphere highlight gradient */}
          <defs>
            <radialGradient id="sphereHighlight" cx="30%" cy="30%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Hover/Selected Info Panel */}
        {activeNode && (
          <div
            className="absolute top-3 left-3 p-3 rounded-lg text-xs backdrop-blur-sm"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid var(--notion-border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <div className="font-bold mb-1.5" style={{ color: "var(--notion-text)" }}>
              {activeNode}
            </div>
            <div className="space-y-1" style={{ color: "var(--notion-text-secondary)" }}>
              {(() => {
                const node = nodes3D.find((n) => n.name === activeNode);
                if (!node) return null;
                return (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: getDomainColor(node.domain) }}
                      />
                      {node.domain}
                    </div>
                    <div>Pair 협업: <strong>{node.pairCount}건</strong></div>
                    <div>대기 중: <strong style={{ color: node.waitingOnInbound >= 2 ? "#ef4444" : undefined }}>{node.waitingOnInbound}명</strong></div>
                    <div>총 연결: <strong>{node.degree}건</strong></div>
                  </>
                );
              })()}
            </div>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="mt-2 text-xs px-2 py-1 rounded"
                style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-blue)" }}
              >
                선택 해제
              </button>
            )}
          </div>
        )}

        {/* Interaction hint */}
        <div
          className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded"
          style={{ background: "rgba(0,0,0,0.4)", color: "white" }}
        >
          드래그하여 회전
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--notion-border)" }}>
        {Array.from(new Set(nodes3D.map((n) => n.domain))).map((domain) => (
          <span
            key={domain}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
            style={{ background: "var(--notion-bg-secondary)" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: getDomainColor(domain) }}
            />
            {domain}
          </span>
        ))}
      </div>
    </div>
  );
}

