"use client";

import { useState, useRef } from "react";

interface TestResult {
  iteration: number;
  totalTime: number;
  ttfb: number;
  domParsing: number;
  loadComplete: number;
  timestamp: string;
}

interface RouteInfo {
  path: string;
  label: string;
}

interface Stats {
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  p99: number;
}

const ALL_ROUTES: RouteInfo[] = [
  { path: "/my", label: "My Dashboard" },
  { path: "/my/alignment", label: "My Alignment" },
  { path: "/feedbacks", label: "Feedbacks" },
  { path: "/works/team-feed", label: "Team Feed" },
  { path: "/works/plans/gantt", label: "Plans Gantt" },
  { path: "/works/snapshots", label: "Snapshots" },
  { path: "/works/alignment", label: "Works Alignment" },
  { path: "/works/work-map", label: "Work Map" },
  { path: "/works/collaborator-graph", label: "Collaborator Graph" },
  { path: "/manage/snapshots", label: "Snapshot Management" },
  { path: "/admin", label: "Admin Dashboard" },
  { path: "/admin/plans", label: "Admin Plans" },
  { path: "/admin/meta-options", label: "Meta Options" },
  { path: "/admin/members", label: "Members" },
  { path: "/admin/menu-usage", label: "Menu Usage" },
  { path: "/admin/menu-settings", label: "Menu Settings" },
  { path: "/releases", label: "Release Notes" },
];

function calculateStats(values: number[]): Stats {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

async function measurePageLoad(url: string): Promise<TestResult> {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      reject(new Error("Timeout"));
    }, 30000);

    iframe.onload = async () => {
      clearTimeout(timeout);

      try {
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        const perfData = iframe.contentWindow?.performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming | undefined;

        const metrics: TestResult = {
          totalTime,
          ttfb: perfData ? perfData.responseStart - perfData.fetchStart : 0,
          domParsing: perfData
            ? perfData.domContentLoadedEventEnd - perfData.fetchStart
            : 0,
          loadComplete: perfData
            ? perfData.loadEventEnd - perfData.fetchStart
            : 0,
          iteration: 0,
          timestamp: new Date().toISOString(),
        };

        document.body.removeChild(iframe);
        resolve(metrics);
      } catch (error) {
        document.body.removeChild(iframe);
        reject(error);
      }
    };

    iframe.onerror = () => {
      clearTimeout(timeout);
      document.body.removeChild(iframe);
      reject(new Error("Load error"));
    };

    iframe.src = url;
  });
}

export function PerformanceTestView() {
  const [targetUrl, setTargetUrl] = useState("/my");
  const [iterations, setIterations] = useState(100);
  const [concurrency, setConcurrency] = useState(5);
  const [testRunning, setTestRunning] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"running" | "done" | "">("");
  const [progress, setProgress] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [allRoutesResults, setAllRoutesResults] = useState<
    Record<string, TestResult[]>
  >({});
  const [routeProgress, setRouteProgress] = useState<Record<string, number>>(
    {}
  );
  const [showAllRoutes, setShowAllRoutes] = useState(false);

  const startSingleTest = async () => {
    setTestRunning(true);
    setShouldStop(false);
    setTestResults([]);
    setProgress(0);
    setShowAllRoutes(false);

    setStatus(`테스트 실행 중... (0/${iterations})`);
    setStatusType("running");

    const results: TestResult[] = [];
    let completed = 0;

    const runBatch = async (batchStart: number, batchSize: number) => {
      const promises: Promise<void>[] = [];

      for (let i = 0; i < batchSize; i++) {
        const index = batchStart + i;
        if (index >= iterations || shouldStop) break;

        promises.push(
          (async () => {
            try {
              const metrics = await measurePageLoad(targetUrl);
              results.push({
                ...metrics,
                iteration: index + 1,
              });
            } catch (error) {
              console.error(`테스트 ${index + 1} 실패:`, error);
            } finally {
              completed++;
              const progressPercent = (completed / iterations) * 100;
              setProgress(progressPercent);
              setStatus(`테스트 실행 중... (${completed}/${iterations})`);
            }
          })()
        );
      }

      await Promise.all(promises);
    };

    for (let i = 0; i < iterations; i += concurrency) {
      if (shouldStop) {
        setStatus(`테스트 중단됨 (${completed}/${iterations} 완료)`);
        setStatusType("done");
        break;
      }

      await runBatch(i, concurrency);
    }

    setTestResults(results);
    setTestRunning(false);

    if (!shouldStop) {
      setStatus(`테스트 완료! (${results.length}/${iterations} 성공)`);
      setStatusType("done");
    }
  };

  const startAllRoutesTest = async () => {
    setTestRunning(true);
    setShouldStop(false);
    setAllRoutesResults({});
    setRouteProgress({});
    setShowAllRoutes(true);

    setStatus(`전체 라우트 테스트 시작... (${ALL_ROUTES.length}개 라우트)`);
    setStatusType("running");

    const allResults: Record<string, TestResult[]> = {};

    for (const route of ALL_ROUTES) {
      if (shouldStop) {
        setStatus("테스트 중단됨");
        setStatusType("done");
        break;
      }

      const routeResults: TestResult[] = [];
      let completed = 0;
      setStatus(`테스트 중: ${route.label} (${route.path})`);

      const runBatch = async (batchStart: number, batchSize: number) => {
        const promises: Promise<void>[] = [];

        for (let i = 0; i < batchSize; i++) {
          const index = batchStart + i;
          if (index >= iterations || shouldStop) break;

          promises.push(
            (async () => {
              try {
                const metrics = await measurePageLoad(route.path);
                routeResults.push({
                  ...metrics,
                  iteration: index + 1,
                });
              } catch (error) {
                console.error(`${route.path} 테스트 ${index + 1} 실패:`, error);
              } finally {
                completed++;
                const progressPercent = (completed / iterations) * 100;
                setRouteProgress((prev) => ({
                  ...prev,
                  [route.path]: progressPercent,
                }));
              }
            })()
          );
        }

        await Promise.all(promises);
      };

      for (let i = 0; i < iterations; i += concurrency) {
        if (shouldStop) break;
        await runBatch(i, concurrency);
      }

      allResults[route.path] = routeResults;
      setAllRoutesResults({ ...allResults });
    }

    setTestRunning(false);

    if (!shouldStop) {
      setStatus("전체 라우트 테스트 완료!");
      setStatusType("done");
    }
  };

  const stopTest = () => {
    setShouldStop(true);
  };

  const copyToClipboard = async () => {
    const hasSingleResults = testResults.length > 0;
    const hasAllRoutesResults = Object.keys(allRoutesResults).length > 0;

    if (!hasSingleResults && !hasAllRoutesResults) {
      alert("측정 결과가 없습니다.");
      return;
    }

    const exportData: Record<string, unknown> = {
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    if (hasSingleResults) {
      exportData.singleRoute = {
        url: targetUrl,
        totalTests: testResults.length,
        results: testResults,
      };
    }

    if (hasAllRoutesResults) {
      exportData.allRoutes = {};
      for (const [route, results] of Object.entries(allRoutesResults)) {
        (exportData.allRoutes as Record<string, unknown>)[route] = {
          totalTests: results.length,
          results: results,
        };
      }
    }

    const jsonString = JSON.stringify(exportData, null, 2);

    try {
      await navigator.clipboard.writeText(jsonString);
      alert("결과가 클립보드에 복사되었습니다.");
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  const renderSingleTestResults = () => {
    if (testResults.length === 0) return null;

    const totalTimes = testResults.map((r) => r.totalTime);
    const stats = calculateStats(totalTimes);

    const ranges = [
      { label: "< 500ms", min: 0, max: 500 },
      { label: "500ms-1s", min: 500, max: 1000 },
      { label: "1-2s", min: 1000, max: 2000 },
      { label: "2-3s", min: 2000, max: 3000 },
      { label: "3-5s", min: 3000, max: 5000 },
      { label: "> 5s", min: 5000, max: Infinity },
    ];

    const maxCount = Math.max(
      ...ranges.map(
        (r) => totalTimes.filter((t) => t >= r.min && t < r.max).length
      )
    );

    return (
      <div className="mt-4">
        <h2 className="text-sm font-semibold text-[#24292f] mb-3 pb-2 border-b border-[#d0d7de]">
          측정 결과
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          <div className="p-2 border border-[#d0d7de] rounded">
            <div className="text-xs text-[#57606a] mb-0.5">최소 시간</div>
            <div className="text-lg font-semibold text-[#0969da]">
              {stats.min.toFixed(0)}
              <span className="text-xs text-[#57606a] ml-1">ms</span>
            </div>
          </div>
          <div className="p-2 border border-[#d0d7de] rounded">
            <div className="text-xs text-[#57606a] mb-0.5">최대 시간</div>
            <div className="text-lg font-semibold text-[#0969da]">
              {stats.max.toFixed(0)}
              <span className="text-xs text-[#57606a] ml-1">ms</span>
            </div>
          </div>
          <div className="p-2 border border-[#d0d7de] rounded">
            <div className="text-xs text-[#57606a] mb-0.5">평균 시간</div>
            <div className="text-lg font-semibold text-[#0969da]">
              {stats.avg.toFixed(0)}
              <span className="text-xs text-[#57606a] ml-1">ms</span>
            </div>
          </div>
          <div className="p-2 border border-[#d0d7de] rounded">
            <div className="text-xs text-[#57606a] mb-0.5">중앙값</div>
            <div className="text-lg font-semibold text-[#0969da]">
              {stats.median.toFixed(0)}
              <span className="text-xs text-[#57606a] ml-1">ms</span>
            </div>
          </div>
          <div className="p-2 border border-[#d0d7de] rounded">
            <div className="text-xs text-[#57606a] mb-0.5">95 백분위수</div>
            <div className="text-lg font-semibold text-[#0969da]">
              {stats.p95.toFixed(0)}
              <span className="text-xs text-[#57606a] ml-1">ms</span>
            </div>
          </div>
          <div className="p-2 border border-[#d0d7de] rounded">
            <div className="text-xs text-[#57606a] mb-0.5">99 백분위수</div>
            <div className="text-lg font-semibold text-[#0969da]">
              {stats.p99.toFixed(0)}
              <span className="text-xs text-[#57606a] ml-1">ms</span>
            </div>
          </div>
        </div>

        <div className="p-3 border border-[#d0d7de] rounded">
          <h3 className="text-xs font-semibold text-[#24292f] mb-2">
            시간대별 분포
          </h3>
          <div className="space-y-1.5">
            {ranges.map((range) => {
              const count = totalTimes.filter(
                (t) => t >= range.min && t < range.max
              ).length;
              const percentage = ((count / testResults.length) * 100).toFixed(
                1
              );
              const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div key={range.label} className="flex items-center text-xs">
                  <div className="w-20 text-[#57606a]">{range.label}</div>
                  <div className="flex-1 h-4 bg-[#f6f8fa] rounded mx-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0969da] to-[#1f6feb] transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="w-24 text-right font-semibold text-[#24292f]">
                    {count}회 ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderAllRoutesResults = () => {
    if (Object.keys(allRoutesResults).length === 0) return null;

    return (
      <div className="mt-4">
        <h2 className="text-sm font-semibold text-[#24292f] mb-3 pb-2 border-b border-[#d0d7de]">
          라우트별 성능 측정
        </h2>
        <div className="space-y-3">
          {ALL_ROUTES.map((route) => {
            const results = allRoutesResults[route.path] || [];
            if (results.length === 0) return null;

            const totalTimes = results.map((r) => r.totalTime);
            const ttfbs = results.map((r) => r.ttfb);
            const domParsings = results.map((r) => r.domParsing);

            const totalStats = calculateStats(totalTimes);
            const ttfbStats = calculateStats(ttfbs);
            const domStats = calculateStats(domParsings);

            const progressPercent = routeProgress[route.path] || 0;

            return (
              <div
                key={route.path}
                className="p-2.5 border border-[#d0d7de] rounded bg-[#fafbfc]"
              >
                <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-[#d0d7de]">
                  <div className="text-sm font-semibold text-[#24292f]">
                    {route.label}{" "}
                    <span className="text-[#57606a] font-normal text-xs">
                      ({route.path})
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-[#57606a]">
                    <span>평균: {totalStats.avg.toFixed(0)}ms</span>
                    <span>중앙값: {totalStats.median.toFixed(0)}ms</span>
                    <span>P95: {totalStats.p95.toFixed(0)}ms</span>
                  </div>
                </div>

                {testRunning && progressPercent < 100 && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-[#57606a] mb-0.5">
                      <span>진행률</span>
                      <span>
                        {Math.floor((progressPercent / 100) * iterations)}/
                        {iterations}
                      </span>
                    </div>
                    <div className="h-4 bg-[#f6f8fa] rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0969da] to-[#1f6feb] flex items-center justify-center text-white text-xs font-semibold transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      >
                        {progressPercent > 10 && `${progressPercent.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  <div className="p-1.5 bg-white border border-[#d0d7de] rounded">
                    <div className="text-xs text-[#57606a] mb-0.5">최소</div>
                    <div className="text-sm font-semibold text-[#0969da]">
                      {totalStats.min.toFixed(0)}
                      <span className="text-xs text-[#57606a] ml-0.5">ms</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-white border border-[#d0d7de] rounded">
                    <div className="text-xs text-[#57606a] mb-0.5">최대</div>
                    <div className="text-sm font-semibold text-[#0969da]">
                      {totalStats.max.toFixed(0)}
                      <span className="text-xs text-[#57606a] ml-0.5">ms</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-white border border-[#d0d7de] rounded">
                    <div className="text-xs text-[#57606a] mb-0.5">평균</div>
                    <div className="text-sm font-semibold text-[#0969da]">
                      {totalStats.avg.toFixed(0)}
                      <span className="text-xs text-[#57606a] ml-0.5">ms</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-white border border-[#d0d7de] rounded">
                    <div className="text-xs text-[#57606a] mb-0.5">중앙값</div>
                    <div className="text-sm font-semibold text-[#0969da]">
                      {totalStats.median.toFixed(0)}
                      <span className="text-xs text-[#57606a] ml-0.5">ms</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-white border border-[#d0d7de] rounded">
                    <div className="text-xs text-[#57606a] mb-0.5">TTFB 평균</div>
                    <div className="text-sm font-semibold text-[#0969da]">
                      {ttfbStats.avg.toFixed(0)}
                      <span className="text-xs text-[#57606a] ml-0.5">ms</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-white border border-[#d0d7de] rounded">
                    <div className="text-xs text-[#57606a] mb-0.5">DOM 파싱</div>
                    <div className="text-sm font-semibold text-[#0969da]">
                      {domStats.avg.toFixed(0)}
                      <span className="text-xs text-[#57606a] ml-0.5">ms</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-md p-4 shadow-sm border border-[#d0d7de]">
          <h1 className="text-base font-semibold text-[#24292f] mb-3 pb-2 border-b border-[#d0d7de]">
            페이지 로딩 성능 측정 도구
          </h1>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#57606a] whitespace-nowrap">
                페이지 경로
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="/my"
                className="px-2.5 py-1 border border-[#d0d7de] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#57606a] whitespace-nowrap">
                반복 횟수
              </label>
              <input
                type="number"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value) || 1)}
                min="1"
                max="500"
                placeholder="100"
                className="w-20 px-2.5 py-1 border border-[#d0d7de] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#57606a] whitespace-nowrap">
                동시 실행
              </label>
              <input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value) || 1)}
                min="1"
                max="20"
                placeholder="5"
                className="w-16 px-2.5 py-1 border border-[#d0d7de] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-transparent"
              />
            </div>
            <div className="w-px h-6 bg-[#d0d7de] self-center" />
            <button
              onClick={startSingleTest}
              disabled={testRunning}
              className="px-3 py-1 bg-[#2da44e] text-white text-xs rounded hover:bg-[#2c974b] disabled:bg-[#94d3a2] disabled:cursor-not-allowed transition-colors"
            >
              단일 테스트 시작
            </button>
            <button
              onClick={startAllRoutesTest}
              disabled={testRunning}
              className="px-3 py-1 bg-[#2da44e] text-white text-xs rounded hover:bg-[#2c974b] disabled:bg-[#94d3a2] disabled:cursor-not-allowed transition-colors"
            >
              전체 라우트 테스트
            </button>
            <button
              onClick={stopTest}
              disabled={!testRunning}
              className="px-3 py-1 bg-[#d1242f] text-white text-xs rounded hover:bg-[#a40e26] disabled:bg-[#f0b4b4] disabled:cursor-not-allowed transition-colors"
            >
              중단
            </button>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-[#0969da] text-white text-xs rounded hover:bg-[#0860ca] transition-colors"
            >
              결과 복사
            </button>
          </div>

          {status && (
            <div
              className={`px-2.5 py-1.5 rounded text-xs font-semibold mb-3 ${
                statusType === "running"
                  ? "bg-[#ddf4ff] text-[#0969da]"
                  : statusType === "done"
                    ? "bg-[#dafbe1] text-[#1a7f37]"
                    : ""
              }`}
            >
              {status}
            </div>
          )}

          {testRunning && !showAllRoutes && (
            <div className="mb-3">
              <div className="h-5 bg-[#f6f8fa] rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2da44e] to-[#1a7f37] flex items-center justify-center text-white text-xs font-semibold transition-all duration-300"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 0 && `${progress.toFixed(1)}%`}
                </div>
              </div>
            </div>
          )}

          {showAllRoutes ? renderAllRoutesResults() : renderSingleTestResults()}
        </div>
      </div>
    </div>
  );
}
