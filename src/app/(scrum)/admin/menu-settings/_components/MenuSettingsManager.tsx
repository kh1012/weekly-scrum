"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { MenuSetting, MenuSettingInput, TagColor } from "@/lib/data/menuSettings";
import {
  upsertMenuSettingAction,
  deleteMenuSettingAction,
} from "../_actions";

interface MenuSettingsManagerProps {
  workspaceId: string;
  initialSettings: MenuSetting[];
}

// 모든 메뉴 정의 (BASE_NAV_CATEGORIES에서 추출)
const ALL_MENUS = [
  // Community
  { key: "feedbacks", label: "Feedbacks", category: "Community" },
  // Works
  { key: "team-feed", label: "Team Feed", category: "Works" },
  { key: "plans", label: "Plans", category: "Works" },
  { key: "snapshots", label: "Snapshots", category: "Works" },
  { key: "work-map", label: "Work Map", category: "Works" },
  { key: "collaborator-graph", label: "Collaborator Graph", category: "Works" },
  // Personal Space
  { key: "my-dashboard", label: "My Dashboard", category: "Personal Space" },
  { key: "my-snapshots", label: "Snapshot Management", category: "Personal Space" },
  // Admin Space
  { key: "admin-dashboard", label: "Admin Dashboard", category: "Admin Space" },
  { key: "admin-plans", label: "Plans Management", category: "Admin Space" },
  { key: "admin-meta-options", label: "Meta Options", category: "Admin Space" },
  { key: "admin-members", label: "Members", category: "Admin Space" },
  { key: "admin-menu-usage", label: "Menu Usage", category: "Admin Space" },
  // Extras
  { key: "releases", label: "Release Notes", category: "Extras" },
];

const TAG_COLORS: { value: TagColor; label: string; preview: string }[] = [
  { value: "blue", label: "Blue", preview: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "green", label: "Green", preview: "bg-green-100 text-green-700 border-green-300" },
  { value: "orange", label: "Orange", preview: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "pink", label: "Pink", preview: "bg-pink-100 text-pink-700 border-pink-300" },
  { value: "purple", label: "Purple", preview: "bg-purple-100 text-purple-700 border-purple-300" },
  { value: "gray", label: "Gray", preview: "bg-gray-100 text-gray-700 border-gray-300" },
];

export function MenuSettingsManager({
  workspaceId,
  initialSettings,
}: MenuSettingsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<typeof ALL_MENUS[0] | null>(null);
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
  const filteredMenus = ALL_MENUS.filter((menu) =>
    menu.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    menu.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    menu.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 편집 모달 열기
  const handleEdit = (menuKey: string) => {
    const menu = ALL_MENUS.find(m => m.key === menuKey);
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

  // 기본값으로 되돌리기
  const handleReset = async (menuKey: string) => {
    if (!confirm("이 메뉴 설정을 기본값으로 되돌리시겠습니까?")) return;

    startTransition(async () => {
      const result = await deleteMenuSettingAction(workspaceId, menuKey);
      if (result.success) {
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
      tag_color: setting?.tag_color as TagColor || null,
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

  return (
    <>
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
                  {editingMenu.label} <span className="text-xs font-mono">({editingMenu.key})</span>
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-md hover:bg-[#f6f8fa] transition-colors"
              >
                <svg className="w-5 h-5 text-[#57606a]" fill="currentColor" viewBox="0 0 20 20">
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
                    onClick={() => setFormData({ ...formData, is_enabled: !formData.is_enabled })}
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
                      onClick={() => setFormData({ ...formData, tag_color: color.value })}
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
                      TAG_COLORS.find((c) => c.value === formData.tag_color)?.preview ||
                      "bg-gray-100 text-gray-700 border-gray-300"
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
          <h1 className="text-2xl font-bold text-[#24292f] mb-2">Menu Settings</h1>
          <p className="text-sm text-[#57606a]">
            SNB 메뉴의 노출 여부와 태그를 관리합니다. 설정은 모든 워크스페이스 멤버에게 적용됩니다.
          </p>
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
                      key={menu.key}
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
                          } ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
                              TAG_COLORS.find((c) => c.value === setting.tag_color)
                                ?.preview || "bg-gray-100 text-gray-700 border-gray-300"
                            }`}
                          >
                            {setting.tag_label}
                          </span>
                        ) : (
                          <span className="text-xs text-[#8c959f]">태그 없음</span>
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
                              onClick={() => handleReset(menu.key)}
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
            <svg className="w-5 h-5 text-[#0969da] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

