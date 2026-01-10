"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  MenuSetting,
  MenuSettingInput,
  TagColor,
} from "@/lib/data/menu";
import {
  upsertMenuSettingAction,
  deleteMenuSettingAction,
  bulkUpsertMenuSettingsAction,
  bulkDeleteMenuSettingsAction,
  getMenuUsageForTaggingAction,
} from "../_actions";

interface MenuSettingsManagerProps {
  workspaceId: string;
  initialSettings: MenuSetting[];
}

// 모든 메뉴 정의 (Navigation.tsx의 BASE_NAV_CATEGORIES와 일치)
// menu_group 정보도 함께 저장하여 정확한 매핑 가능하도록 함
const ALL_MENUS = [
  // Community
  {
    key: "feedbacks",
    label: "Feedbacks",
    category: "Community",
    group: "community",
  },
  // Works
  { key: "team-feed", label: "Team Feed", category: "Works", group: "works" },
  { key: "plans", label: "Plans", category: "Works", group: "works" },
  {
    key: "figma-files",
    label: "Figma Files",
    category: "Works",
    group: "works",
  },
  { key: "snapshots", label: "Snapshots", category: "Works", group: "works" },
  { key: "alignment", label: "Alignment", category: "Works", group: "works" },
  { key: "work-map", label: "Work Map", category: "Works", group: "works" },
  {
    key: "collaborator-graph",
    label: "Collaborator Graph",
    category: "Works",
    group: "works",
  },
  // Personal Space
  {
    key: "my-dashboard",
    label: "My Dashboard",
    category: "Personal Space",
    group: "personal",
  }, // Navigation.tsx와 일치
  {
    key: "my-alignment",
    label: "My Alignment",
    category: "Personal Space",
    group: "personal",
  }, // Navigation.tsx와 일치
  {
    key: "my-snapshots",
    label: "Snapshot Management",
    category: "Personal Space",
    group: "personal",
  }, // Navigation.tsx와 일치
  // Admin Space
  {
    key: "admin-dashboard",
    label: "Admin Dashboard",
    category: "Admin Space",
    group: "admin",
  }, // Navigation.tsx와 일치
  {
    key: "admin-plans",
    label: "Plans Management",
    category: "Admin Space",
    group: "admin",
  },
  {
    key: "admin-meta-options",
    label: "Meta Options",
    category: "Admin Space",
    group: "admin",
  }, // Navigation.tsx와 일치
  {
    key: "admin-members",
    label: "Members",
    category: "Admin Space",
    group: "admin",
  },
  {
    key: "admin-menu-usage",
    label: "Menu Usage",
    category: "Admin Space",
    group: "admin",
  },
  {
    key: "admin-menu-settings",
    label: "Menu Settings",
    category: "Admin Space",
    group: "admin",
  }, // Navigation.tsx에 있음
  // Extras
  {
    key: "releases",
    label: "Release Notes",
    category: "Extras",
    group: "extra",
  }, // Navigation.tsx와 일치
];

// 레거시 키를 현재 키로 매핑 (이전 PAGE_VIEW 데이터 호환)
// 키 형식: "group:oldKey" => "newKey"
const LEGACY_KEY_MAP: Record<string, string> = {
  "personal:snapshots-management": "my-snapshots",
  "personal:dashboard": "my-dashboard",
  "admin:dashboard": "admin-dashboard",
  "admin:meta-options": "admin-meta-options",
  "admin:weekly-log": "admin-snapshots",
  "etc:release-notes": "releases",
  "extra:release-notes": "releases",
};

// menu_group과 menu_key 조합으로 MenuSettingsManager의 메뉴를 찾는 함수
// menu_settings 테이블에는 menu_key만 저장되므로, 같은 menu_key가 여러 개 있으면 첫 번째 매칭 사용
function findMenuByGroupAndKey(
  menuGroup: string | null,
  menuKey: string | null
): (typeof ALL_MENUS)[0] | undefined {
  if (!menuKey) return undefined;

  let actualMenuKey = menuKey;

  // 1. 레거시 키 변환 시도
  if (menuGroup) {
    const legacyKey = `${menuGroup}:${menuKey}`;
    if (LEGACY_KEY_MAP[legacyKey]) {
      actualMenuKey = LEGACY_KEY_MAP[legacyKey];
    }
  }

  // 2. menu_group이 있으면 정확히 매칭 시도
  if (menuGroup) {
    const exactMatch = ALL_MENUS.find(
      (m) => m.key === actualMenuKey && m.group === menuGroup
    );
    if (exactMatch) return exactMatch;
  }

  // 3. 정확한 매칭이 없으면 menu_key만으로 매칭 (첫 번째 매칭)
  // 주의: 같은 menu_key가 여러 개 있으면 첫 번째 것만 반환됨
  return ALL_MENUS.find((m) => m.key === actualMenuKey);
}

const TAG_COLORS: { value: TagColor; label: string; preview: string }[] = [
  {
    value: "blue",
    label: "Blue",
    preview: "bg-blue-100 text-blue-700 border-blue-300",
  },
  {
    value: "green",
    label: "Green",
    preview: "bg-green-100 text-green-700 border-green-300",
  },
  {
    value: "orange",
    label: "Orange",
    preview: "bg-orange-100 text-orange-700 border-orange-300",
  },
  {
    value: "pink",
    label: "Pink",
    preview: "bg-pink-100 text-pink-700 border-pink-300",
  },
  {
    value: "purple",
    label: "Purple",
    preview: "bg-purple-100 text-purple-700 border-purple-300",
  },
  {
    value: "gray",
    label: "Gray",
    preview: "bg-gray-100 text-gray-700 border-gray-300",
  },
];

export function MenuSettingsManager({
  workspaceId,
  initialSettings,
}: MenuSettingsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isTaggingPending, setIsTaggingPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);
  const [isTaggingPreviewModalOpen, setIsTaggingPreviewModalOpen] =
    useState(false);
  const [resettingMenuKey, setResettingMenuKey] = useState<string | null>(null);
  const [taggingPreview, setTaggingPreview] = useState<{
    top3: Array<{
      menu_key: string;
      menu_group: string | null;
      total_count: number;
      label: string;
    }>;
    bottom3: Array<{
      menu_key: string;
      menu_group: string | null;
      total_count: number;
      label: string;
    }>;
  } | null>(null);
  const [editingMenu, setEditingMenu] = useState<(typeof ALL_MENUS)[0] | null>(
    null
  );
  const [formData, setFormData] = useState<{
    is_enabled: boolean;
    tag_label: string;
    tag_color: TagColor | "";
  }>({
    is_enabled: true,
    tag_label: "",
    tag_color: "",
  });

  // 설정을 Map으로 변환
  const settingsMap = new Map(initialSettings.map((s) => [s.menu_key, s]));

  // 검색 필터링
  const filteredMenus = ALL_MENUS.filter(
    (menu) =>
      menu.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 편집 모달 열기
  const handleEdit = (menuKey: string) => {
    const menu = ALL_MENUS.find((m) => m.key === menuKey);
    if (!menu) return;

    const setting = settingsMap.get(menuKey);
    setEditingMenu(menu);
    setFormData({
      is_enabled: setting?.is_enabled ?? true,
      tag_label: setting?.tag_label || "",
      tag_color: (setting?.tag_color as TagColor) || "",
    });
    setIsModalOpen(true);
  };

  // 편집 취소
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingMenu(null);
    setFormData({ is_enabled: true, tag_label: "", tag_color: "" });
  };

  // 저장
  const handleSave = async () => {
    if (!editingMenu) return;

    const input: MenuSettingInput = {
      menu_key: editingMenu.key,
      is_enabled: formData.is_enabled,
      tag_label: formData.tag_label.trim() || null,
      tag_color: formData.tag_color || null,
    };

    startTransition(async () => {
      const result = await upsertMenuSettingAction(workspaceId, input);
      if (result.success) {
        setIsModalOpen(false);
        setEditingMenu(null);
        router.refresh();
      } else {
        alert(`저장 실패: ${result.error}`);
      }
    });
  };

  // 기본값으로 되돌리기 모달 열기
  const handleResetClick = (menuKey: string) => {
    setResettingMenuKey(menuKey);
    setIsResetModalOpen(true);
  };

  // 기본값으로 되돌리기 실행
  const handleResetConfirm = async () => {
    if (!resettingMenuKey) return;

    startTransition(async () => {
      const result = await deleteMenuSettingAction(
        workspaceId,
        resettingMenuKey
      );
      if (result.success) {
        setIsResetModalOpen(false);
        setResettingMenuKey(null);
        router.refresh();
      } else {
        alert(`초기화 실패: ${result.error}`);
      }
    });
  };

  // 전체 초기화 모달 열기
  const handleResetAllClick = () => {
    setIsResetAllModalOpen(true);
  };

  // 전체 초기화 실행 (병렬 처리)
  const handleResetAllConfirm = async () => {
    startTransition(async () => {
      // 설정이 있는 모든 메뉴 키 가져오기
      const menuKeysToDelete = Array.from(settingsMap.keys());

      // 일괄 삭제 (단일 DB 쿼리로 병렬 처리)
      const result = await bulkDeleteMenuSettingsAction(
        workspaceId,
        menuKeysToDelete
      );

      if (result.success) {
        setIsResetAllModalOpen(false);
        router.refresh();
      } else {
        alert(`초기화 실패: ${result.error}`);
      }
    });
  };

  // 토글 스위치 처리
  const handleToggle = async (menuKey: string, currentValue: boolean) => {
    const setting = settingsMap.get(menuKey);
    const input: MenuSettingInput = {
      menu_key: menuKey,
      is_enabled: !currentValue,
      tag_label: setting?.tag_label || null,
      tag_color: (setting?.tag_color as TagColor) || null,
    };

    startTransition(async () => {
      const result = await upsertMenuSettingAction(workspaceId, input);
      if (!result.success) {
        alert(`변경 실패: ${result.error}`);
      } else {
        router.refresh();
      }
    });
  };

  // PAGE_VIEW 기준으로 태그 자동 적용 - 미리보기
  const handleAutoTagByPageView = async () => {
    setIsTaggingPending(true);

    try {
      // PAGE_VIEW 데이터 가져오기
      const usageResult = await getMenuUsageForTaggingAction(workspaceId, 8);

      if (!usageResult.success) {
        alert(`데이터 조회 실패: ${usageResult.error}`);
        setIsTaggingPending(false);
        return;
      }

      // unknown 및 매핑되지 않는 메뉴 필터링
      const usageData = usageResult.data.filter((item) => {
        // menu_key가 없거나 null이면 제외
        if (!item.menu_key) return false;

        // ALL_MENUS에 매핑되는지 확인
        const menu = findMenuByGroupAndKey(item.menu_group, item.menu_key);
        return menu !== undefined;
      });

      // 메뉴가 5개 미만이면 처리 불가
      if (usageData.length < 5) {
        alert(
          `태그를 적용하려면 최소 5개 이상의 메뉴가 필요합니다. (현재: ${usageData.length}개, 필터링 전: ${usageResult.data.length}개)`
        );
        setIsTaggingPending(false);
        return;
      }

      // 상위 5개와 하위 3개 선정
      const top5 = usageData.slice(0, 5);
      const bottom3 = usageData.slice(-3);

      // 메뉴 정보 매핑
      const top5WithLabels = top5.map((item) => {
        const menu = findMenuByGroupAndKey(item.menu_group, item.menu_key);
        return {
          ...item,
          label: menu?.label || item.menu_key,
        };
      });

      const bottom3WithLabels = bottom3.map((item) => {
        const menu = findMenuByGroupAndKey(item.menu_group, item.menu_key);
        return {
          ...item,
          label: menu?.label || item.menu_key,
        };
      });

      // 미리보기 모달 표시
      setTaggingPreview({
        top3: top5WithLabels, // 속성명은 유지하되 top5 데이터 전달
        bottom3: bottom3WithLabels,
      });
      setIsTaggingPreviewModalOpen(true);
    } catch (error) {
      console.error("[handleAutoTagByPageView] Error:", error);
      alert(
        `오류 발생: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsTaggingPending(false);
    }
  };

  // 태그 적용 확인 및 실행
  const handleApplyTags = async () => {
    if (!taggingPreview) return;

    setIsTaggingPending(true);
    setIsTaggingPreviewModalOpen(false);

    try {
      // 기존 설정을 유지하면서 태그만 업데이트할 입력 데이터 생성
      const updates: MenuSettingInput[] = [];

      // 상위 5개에 TOP 태그 적용 (하위는 태그 적용하지 않음)
      const medalEmojis = ["🥇", "🥈", "🥉", "⭐", "⭐"];

      taggingPreview.top3.forEach((item, index) => {
        const menu = findMenuByGroupAndKey(item.menu_group, item.menu_key);
        if (menu) {
          const existingSetting = settingsMap.get(menu.key);
          updates.push({
            menu_key: menu.key,
            is_enabled: existingSetting?.is_enabled ?? true,
            tag_label: `${medalEmojis[index]} TOP ${index + 1}`,
            tag_color: index < 3 ? "orange" : "blue", // 금은동은 orange, 나머지는 blue
          });
        }
      });

      // 하위 3개는 태그를 적용하지 않음 (미리보기에만 표시)

      // 일괄 업데이트
      const result = await bulkUpsertMenuSettingsAction(workspaceId, updates);

      if (result.success) {
        setTaggingPreview(null);
        router.refresh();
      } else {
        alert(`태그 적용 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("[handleApplyTags] Error:", error);
      alert(
        `오류 발생: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsTaggingPending(false);
    }
  };

  return (
    <>
      {/* 전체 초기화 확인 모달 */}
      {isResetAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#d0d7de]">
              <h3 className="text-lg font-semibold text-[#cf222e]">
                전체 메뉴 설정 초기화
              </h3>
              <button
                onClick={() => setIsResetAllModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-[#f6f8fa] transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#57606a]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4 p-3 bg-[#ffebe9] border border-[#cf222e] rounded-md">
                <p className="text-sm text-[#cf222e] font-semibold">
                  ⚠️ 주의: 이 작업은 되돌릴 수 없습니다!
                </p>
              </div>
              <p className="text-sm text-[#57606a] mb-4">
                모든 메뉴 설정을 기본값으로 되돌리시겠습니까?
              </p>
              <div className="space-y-2 text-sm text-[#57606a]">
                <p className="flex items-center gap-2">
                  <span className="text-[#cf222e]">✕</span>
                  모든 태그가 제거됩니다.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#cf222e]">✕</span>
                  모든 메뉴가 기본 활성화 상태로 돌아갑니다.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#8c959f]">→</span>
                  현재 {settingsMap.size}개의 설정이 삭제됩니다.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-[#f6f8fa] border-t border-[#d0d7de] rounded-b-lg">
              <button
                onClick={() => setIsResetAllModalOpen(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-[#57606a] hover:bg-white border border-[#d0d7de] rounded-md transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleResetAllConfirm}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#cf222e] hover:bg-[#a40e26] rounded-md transition-colors disabled:opacity-50"
              >
                {isPending ? "초기화 중..." : "전체 초기화"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 초기화 확인 모달 */}
      {isResetModalOpen && resettingMenuKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#d0d7de]">
              <h3 className="text-lg font-semibold text-[#24292f]">
                메뉴 설정 초기화
              </h3>
              <button
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResettingMenuKey(null);
                }}
                className="p-1.5 rounded-md hover:bg-[#f6f8fa] transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#57606a]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-[#57606a] mb-4">
                이 메뉴 설정을 기본값으로 되돌리시겠습니까?
              </p>
              <p className="text-xs text-[#8c959f] mb-4">
                메뉴 키: <span className="font-mono">{resettingMenuKey}</span>
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-[#f6f8fa] border-t border-[#d0d7de] rounded-b-lg">
              <button
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResettingMenuKey(null);
                }}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-[#57606a] hover:bg-white border border-[#d0d7de] rounded-md transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleResetConfirm}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#cf222e] hover:bg-[#a40e26] rounded-md transition-colors disabled:opacity-50"
              >
                {isPending ? "초기화 중..." : "초기화"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 태그 적용 미리보기 모달 */}
      {isTaggingPreviewModalOpen && taggingPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full animate-in fade-in-0 zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#d0d7de]">
              <div>
                <h3 className="text-lg font-semibold text-[#24292f]">
                  태그 적용 미리보기
                </h3>
                <p className="text-sm text-[#57606a] mt-1">
                  PAGE_VIEW 집계를 기준으로 상위/하위 메뉴에 태그를 적용합니다.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsTaggingPreviewModalOpen(false);
                  setTaggingPreview(null);
                }}
                className="p-1.5 rounded-md hover:bg-[#f6f8fa] transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#57606a]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-6">
              {/* 상위 5개 */}
              <div>
                <h4 className="text-sm font-semibold text-[#24292f] mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-green-100 text-green-700 border-green-300">
                    상위 5개 (태그 적용)
                  </span>
                </h4>
                <div className="space-y-2">
                  {taggingPreview.top3.map((item, index) => {
                    const medalEmojis = ["🥇", "🥈", "🥉", "⭐", "⭐"];
                    const bgColors = [
                      "bg-orange-100 text-orange-700 border-orange-300",
                      "bg-orange-100 text-orange-700 border-orange-300",
                      "bg-orange-100 text-orange-700 border-orange-300",
                      "bg-blue-100 text-blue-700 border-blue-300",
                      "bg-blue-100 text-blue-700 border-blue-300",
                    ];

                    return (
                      <div
                        key={`${item.menu_group}:${item.menu_key}`}
                        className="flex items-center justify-between p-3 bg-[#f6f8fa] border border-[#d0d7de] rounded-md"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#24292f]">
                            {item.label}
                          </div>
                          <div className="text-xs text-[#57606a] font-mono mt-1">
                            {item.menu_key}{" "}
                            {item.menu_group && `(${item.menu_group})`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#57606a]">
                            {item.total_count.toLocaleString()}회
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${bgColors[index]}`}
                          >
                            {medalEmojis[index]} TOP {index + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 하위 3개 */}
              <div>
                <h4 className="text-sm font-semibold text-[#24292f] mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-700 border-gray-300">
                    하위 3개 (참고용)
                  </span>
                </h4>
                <div className="space-y-2">
                  {taggingPreview.bottom3.map((item, index) => (
                    <div
                      key={`${item.menu_group}:${item.menu_key}`}
                      className="flex items-center justify-between p-3 bg-[#f6f8fa] border border-[#d0d7de] rounded-md opacity-60"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#24292f]">
                          {item.label}
                        </div>
                        <div className="text-xs text-[#57606a] font-mono mt-1">
                          {item.menu_key}{" "}
                          {item.menu_group && `(${item.menu_group})`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#57606a]">
                          {item.total_count.toLocaleString()}회
                        </span>
                        <span className="text-xs text-[#8c959f]">
                          태그 미적용
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#ddf4ff] border border-[#54aeff] rounded-md">
                  <p className="text-xs text-[#0969da]">
                    ℹ️ 상위 5개 메뉴에만 TOP 태그가 적용됩니다.
                  </p>
                </div>
                <div className="p-3 bg-[#fff8c5] border border-[#d4a72c] rounded-md">
                  <p className="text-xs text-[#7d4e00]">
                    ⚠️ 기존 태그가 있는 메뉴는 덮어씌워집니다.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-[#f6f8fa] border-t border-[#d0d7de] rounded-b-lg">
              <button
                onClick={() => {
                  setIsTaggingPreviewModalOpen(false);
                  setTaggingPreview(null);
                }}
                disabled={isTaggingPending}
                className="px-4 py-2 text-sm font-medium text-[#57606a] hover:bg-white border border-[#d0d7de] rounded-md transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleApplyTags}
                disabled={isTaggingPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0969da] hover:bg-[#0860ca] rounded-md transition-colors disabled:opacity-50"
              >
                {isTaggingPending ? "적용 중..." : "적용하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 편집 모달 */}
      {isModalOpen && editingMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-150">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#d0d7de]">
              <div>
                <h3 className="text-lg font-semibold text-[#24292f]">
                  메뉴 설정 편집
                </h3>
                <p className="text-sm text-[#57606a] mt-1">
                  {editingMenu.label}{" "}
                  <span className="text-xs font-mono">({editingMenu.key})</span>
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-md hover:bg-[#f6f8fa] transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#57606a]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* 내용 */}
            <div className="px-6 py-4 space-y-4">
              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-[#24292f] mb-1">
                  카테고리
                </label>
                <div className="px-3 py-2 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-sm text-[#57606a]">
                  {editingMenu.category}
                </div>
              </div>

              {/* Enabled 토글 */}
              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#24292f]">
                    메뉴 활성화
                  </span>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_enabled: !formData.is_enabled,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.is_enabled ? "bg-[#0969da]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
                <p className="text-xs text-[#57606a] mt-1">
                  비활성화 시 SNB에서 숨겨집니다.
                </p>
              </div>

              {/* 태그 라벨 */}
              <div>
                <label className="block text-sm font-medium text-[#24292f] mb-1">
                  태그 라벨
                </label>
                <input
                  type="text"
                  placeholder="예: NEW, HOT, BETA"
                  value={formData.tag_label}
                  onChange={(e) =>
                    setFormData({ ...formData, tag_label: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
                />
              </div>

              {/* 태그 색상 */}
              <div>
                <label className="block text-sm font-medium text-[#24292f] mb-2">
                  태그 색상
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, tag_color: color.value })
                      }
                      className={`px-3 py-2 rounded-md text-xs font-medium border transition-all ${
                        formData.tag_color === color.value
                          ? `${color.preview} ring-2 ring-offset-2 ring-[#0969da]`
                          : `${color.preview} opacity-60 hover:opacity-100`
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 미리보기 */}
              {formData.tag_label && formData.tag_color && (
                <div className="pt-2 border-t border-[#d0d7de]">
                  <label className="block text-sm font-medium text-[#24292f] mb-2">
                    미리보기
                  </label>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      TAG_COLORS.find((c) => c.value === formData.tag_color)
                        ?.preview || "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {formData.tag_label}
                  </span>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-[#f6f8fa] border-t border-[#d0d7de] rounded-b-lg">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-[#57606a] hover:bg-white border border-[#d0d7de] rounded-md transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0969da] hover:bg-[#0860ca] rounded-md transition-colors disabled:opacity-50"
              >
                {isPending ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-[calc(100vh-5rem)] bg-white">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#24292f] mb-2">
                  Menu Settings
                </h1>
                <p className="text-sm text-[#57606a]">
                  SNB 메뉴의 노출 여부와 태그를 관리합니다. 설정은 모든
                  워크스페이스 멤버에게 적용됩니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetAllClick}
                  disabled={isPending || settingsMap.size === 0}
                  className="px-4 py-2 text-sm font-medium text-[#cf222e] hover:bg-[#ffebe9] border border-[#cf222e] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  전체 초기화
                </button>
                <button
                  onClick={handleAutoTagByPageView}
                  disabled={isTaggingPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0969da] hover:bg-[#0860ca] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isTaggingPending
                    ? "적용 중..."
                    : "PAGE_VIEW 기준 태그 자동 적용"}
                </button>
              </div>
            </div>
            {isTaggingPending && (
              <div className="mt-3 p-3 bg-[#ddf4ff] border border-[#54aeff] rounded-md">
                <p className="text-sm text-[#0969da]">
                  PAGE_VIEW 데이터를 분석하여 상위 3개와 하위 3개 메뉴에 태그를
                  적용하는 중입니다...
                </p>
              </div>
            )}
          </div>

          {/* 검색 */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="메뉴 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-[#d0d7de] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
            />
          </div>

          {/* 테이블 */}
          <div className="bg-white rounded-md border border-[#d0d7de] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f6f8fa] border-b border-[#d0d7de]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                      Menu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                      Enabled
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                      Tag
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {filteredMenus.map((menu) => {
                    const setting = settingsMap.get(menu.key);
                    const isEnabled = setting?.is_enabled ?? true;

                    return (
                      <tr
                        key={`${menu.group}:${menu.key}`}
                        className="hover:bg-[#f6f8fa] transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-[#57606a]">
                          {menu.category}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-[#24292f]">
                          {menu.label}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#57606a] font-mono">
                          {menu.key}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggle(menu.key, isEnabled)}
                            disabled={isPending}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isEnabled ? "bg-[#0969da]" : "bg-gray-300"
                            } ${
                              isPending
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isEnabled ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {setting?.tag_label ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                TAG_COLORS.find(
                                  (c) => c.value === setting.tag_color
                                )?.preview ||
                                "bg-gray-100 text-gray-700 border-gray-300"
                              }`}
                            >
                              {setting.tag_label}
                            </span>
                          ) : (
                            <span className="text-xs text-[#8c959f]">
                              태그 없음
                            </span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(menu.key)}
                              className="px-3 py-1.5 text-sm font-medium text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors"
                            >
                              편집
                            </button>
                            {setting && (
                              <button
                                onClick={() => handleResetClick(menu.key)}
                                disabled={isPending}
                                className="px-3 py-1.5 text-sm font-medium text-[#cf222e] hover:bg-[#ffebe9] rounded-md transition-colors disabled:opacity-50"
                              >
                                초기화
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 안내 */}
          <div className="mt-6 p-4 bg-[#ddf4ff] border border-[#54aeff] rounded-md">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-[#0969da] shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-[#0969da]">
                <p className="font-semibold mb-1">메뉴 설정 안내</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Enabled 스위치를 끄면 해당 메뉴가 SNB에서 숨겨집니다.</li>
                  <li>태그를 설정하면 메뉴 옆에 배지가 표시됩니다.</li>
                  <li>초기화 버튼을 클릭하면 기본값으로 되돌아갑니다.</li>
                  <li>Admin Space 메뉴는 관리자/매니저에게만 표시됩니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
