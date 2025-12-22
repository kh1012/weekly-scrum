/**
 * Help Modal
 * - 기능 설명
 * - 단축키 안내
 * - FAQ
 */

"use client";

import { XIcon } from "@/components/common/Icons";
import { getOSKeys } from "./useOS";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 모달 */}
      <div
        className="relative w-full max-w-2xl max-h-[80vh] mx-4 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
        }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--notion-border)" }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--notion-text)" }}
          >
            📚 도움말
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <XIcon
              className="w-5 h-5"
              style={{ color: "var(--notion-text-muted)" }}
            />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 편집 락 설명 */}
          <section>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: "var(--notion-text)" }}
            >
              🔒 편집 락(점유) 시스템
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--notion-text-muted)" }}
            >
              동시 편집으로 인한 충돌을 방지하기 위해, 한 번에 한 명만 편집할 수 있습니다.
              <strong>&quot;작업 시작&quot;</strong> 버튼을 클릭하면 편집 락을 획득하고,
              다른 사용자는 읽기 전용으로만 볼 수 있습니다.
              작업이 끝나면 반드시 <strong>&quot;작업 종료&quot;</strong> 또는 <strong>&quot;저장&quot;</strong>을 해주세요.
            </p>
            <div
              className="mt-2 p-3 rounded-md text-xs"
              style={{ background: "var(--notion-bg-secondary)" }}
            >
              💡 락은 60초마다 자동 갱신됩니다. 페이지를 떠나면 락이 자동 해제됩니다.
            </div>
          </section>

          {/* 기본 워크플로우 */}
          <section>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: "var(--notion-text)" }}
            >
              📋 기본 워크플로우
            </h3>
            <ol
              className="text-sm space-y-2"
              style={{ color: "var(--notion-text-muted)" }}
            >
              <li className="flex gap-2">
                <span className="font-mono text-blue-500 flex-shrink-0">1.</span>
                <span><strong>작업 시작</strong> 버튼을 클릭하여 편집 모드로 진입</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-blue-500 flex-shrink-0">2.</span>
                <span>타임라인에서 <strong>드래그</strong>하여 새 계획 생성</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-blue-500 flex-shrink-0">3.</span>
                <span>막대를 <strong>클릭</strong>하여 선택, <strong>드래그</strong>로 이동</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-blue-500 flex-shrink-0">4.</span>
                <span>막대 양 끝을 <strong>드래그</strong>하여 기간 조정</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-blue-500 flex-shrink-0">5.</span>
                <span><strong>저장</strong> 버튼으로 서버에 반영</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-blue-500 flex-shrink-0">6.</span>
                <span><strong>작업 종료</strong>로 편집 모드 종료</span>
              </li>
            </ol>
          </section>

          {/* 단축키 */}
          <section>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: "var(--notion-text)" }}
            >
              ⌨️ 단축키
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <ShortcutRow keys={["⌘", "K"]} description="커맨드 팔레트 열기" />
              <ShortcutRow keys={["⌘", "Z"]} description="실행 취소 (Undo)" />
              <ShortcutRow keys={["⌘", "⇧", "Z"]} description="다시 실행 (Redo)" />
              <ShortcutRow keys={["⌘", "S"]} description="저장 (Commit)" />
              <ShortcutRow keys={["⌘", "D"]} description="선택 항목 복제" />
              <ShortcutRow keys={["Delete"]} description="선택 항목 삭제" />
              <ShortcutRow keys={["Esc"]} description="선택 해제 / 모달 닫기" />
            </div>
          </section>

          {/* Lane 규칙 */}
          <section>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: "var(--notion-text)" }}
            >
              📊 겹침 Lane 규칙
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--notion-text-muted)" }}
            >
              같은 Feature에 여러 계획이 있고 기간이 겹치면, 자동으로 여러 줄(Lane)로 표시됩니다.
              시작일이 빠른 순서대로, 동일 시작일이면 기간이 긴 순서대로 배치됩니다.
            </p>
          </section>

          {/* 필터/검색 */}
          <section>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: "var(--notion-text)" }}
            >
              🔍 필터 & 검색
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--notion-text-muted)" }}
            >
              좌측 패널 상단의 검색창에서 프로젝트, 모듈, 기능명을 검색할 수 있습니다.
              &quot;필터&quot; 버튼을 클릭하면 프로젝트/모듈별 체크박스 필터를 사용할 수 있습니다.
            </p>
          </section>

          {/* 타임라인 스크롤링 */}
          <section>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: "var(--notion-text)" }}
            >
              🖱️ 타임라인 스크롤링
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--notion-text-muted)" }}
            >
              타임라인 영역에서 <strong>휠 클릭(중간 버튼)</strong>을 누른 상태로 드래그하면
              가로 및 세로 방향으로 자유롭게 스크롤할 수 있습니다.
              마우스 커서가 이동 아이콘으로 변경되며, 넓은 타임라인을 편리하게 탐색할 수 있습니다.
            </p>
          </section>

          {/* FAQ */}
          <section>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: "var(--notion-text)" }}
            >
              ❓ 자주 묻는 질문
            </h3>
            <div className="space-y-3">
              <FaqItem
                question="편집이 안 돼요"
                answer="현재 다른 사용자가 편집 중일 수 있습니다. 상단의 락 상태를 확인하고, 해당 사용자에게 작업 종료를 요청하세요. 락은 60초 후 자동 만료됩니다."
              />
              <FaqItem
                question="변경 사항이 저장되지 않았어요"
                answer="반드시 '저장' 버튼을 클릭해야 서버에 반영됩니다. 페이지를 새로고침해도 Draft는 로컬에 유지되지만, 확실한 저장을 위해 저장 버튼을 사용하세요."
              />
              <FaqItem
                question="막대가 안 보여요"
                answer="필터가 적용되어 있을 수 있습니다. '필터 초기화'를 시도하거나, 날짜 범위를 확인하세요."
              />
            </div>
          </section>
        </div>

        {/* 푸터 */}
        <div
          className="px-6 py-3 border-t text-center text-xs flex-shrink-0"
          style={{
            borderColor: "var(--notion-border)",
            color: "var(--notion-text-muted)",
          }}
        >
          언제든 <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">⌘K</kbd> 로 커맨드 팔레트를 열 수 있습니다
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({
  keys,
  description,
}: {
  keys: string[];
  description: string;
}) {
  // OS에 맞는 키 표시로 변환
  const displayKeys = getOSKeys(keys);
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {displayKeys.map((key, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 text-xs rounded font-mono"
            style={{
              background: "var(--notion-bg-tertiary)",
              color: "var(--notion-text)",
            }}
          >
            {key}
          </kbd>
        ))}
      </div>
      <span style={{ color: "var(--notion-text-muted)" }}>{description}</span>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div
      className="p-3 rounded-md"
      style={{ background: "var(--notion-bg-secondary)" }}
    >
      <div
        className="font-medium text-sm mb-1"
        style={{ color: "var(--notion-text)" }}
      >
        Q: {question}
      </div>
      <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
        A: {answer}
      </div>
    </div>
  );
}

