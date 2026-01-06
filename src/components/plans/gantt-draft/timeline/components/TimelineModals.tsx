/**
 * TimelineModals - 모든 모달 그룹
 */

"use client";

import { CreatePlanModal, WorkspaceMemberOption } from "../../CreatePlanModal";
import { EditPlanModal } from "../../EditPlanModal";
import { CreateFlagModal } from "../../CreateFlagModal";
import { EditFlagModal } from "../../EditFlagModal";
import { PlanViewPopover } from "../../PlanViewPopover";
import { ModuleSummaryBarPopover } from "../../ModuleSummaryBarPopover";
import { formatDate } from "../../laneLayout";
import { isDateRangeOverlapping } from "../timelineTypes";
import type {
  DraftBar as DraftBarType,
  DraftFlag,
  PlanStatus,
  DraftAssignee,
  PlanLink,
} from "../../types";
import type { DragCreateState, ViewPopoverState, ModuleSummaryPopoverState } from "../timelineTypes";

interface TimelineModalsProps {
  showCreateModal: DragCreateState | null;
  showEditModal: DraftBarType | null;
  showCreateFlagModal: boolean;
  editingFlag: DraftFlag | null;
  viewPopover: ViewPopoverState | null;
  moduleSummaryPopover: ModuleSummaryPopoverState | null;
  flags: DraftFlag[];
  members: WorkspaceMemberOption[];
  workspaceId: string;
  filters: {
    stages: string[];
    assignees: string[];
  };
  setShowCreateModal: (state: DragCreateState | null) => void;
  setShowEditModal: (bar: DraftBarType | null) => void;
  setShowCreateFlagModal: (show: boolean) => void;
  setEditingFlag: (flag: DraftFlag | null) => void;
  setViewPopover: (popover: ViewPopoverState | null) => void;
  setModuleSummaryPopover: (popover: ModuleSummaryPopoverState | null) => void;
  onCreatePlan: (
    modal: DragCreateState | null,
    data: {
      title: string;
      stage: string;
      status: PlanStatus;
      assignees: DraftAssignee[];
      description?: string;
      links?: PlanLink[];
    }
  ) => void;
  updateBar: (clientUid: string, updates: any) => void;
  deleteBar: (clientUid: string) => void;
}

export function TimelineModals({
  showCreateModal,
  showEditModal,
  showCreateFlagModal,
  editingFlag,
  viewPopover,
  moduleSummaryPopover,
  flags,
  members,
  workspaceId,
  filters,
  setShowCreateModal,
  setShowEditModal,
  setShowCreateFlagModal,
  setEditingFlag,
  setViewPopover,
  setModuleSummaryPopover,
  onCreatePlan,
  updateBar,
  deleteBar,
}: TimelineModalsProps) {
  return (
    <>
      {/* 생성 모달 */}
      {showCreateModal && (
        <CreatePlanModal
          isOpen={true}
          onClose={() => setShowCreateModal(null)}
          onCreate={(data) => onCreatePlan(showCreateModal, data)}
          defaultValues={{
            project: showCreateModal.project,
            module: showCreateModal.module,
            feature: showCreateModal.feature,
            startDate: formatDate(showCreateModal.startDate),
            endDate: formatDate(showCreateModal.endDate),
          }}
          members={members}
          activeFilters={{
            stages: filters.stages,
            assignees: filters.assignees,
          }}
        />
      )}

      {/* 수정 모달 */}
      {showEditModal && (
        <EditPlanModal
          isOpen={true}
          onClose={() => setShowEditModal(null)}
          onSave={(data) => {
            updateBar(showEditModal.clientUid, {
              title: data.title,
              stage: data.stage,
              status: data.status,
              assignees: data.assignees,
              description: data.description,
              links: data.links,
            });
            setShowEditModal(null);
          }}
          onDelete={() => {
            deleteBar(showEditModal.clientUid);
            setShowEditModal(null);
          }}
          bar={showEditModal}
          members={members}
          activeFilters={{
            stages: filters.stages,
            assignees: filters.assignees,
          }}
        />
      )}

      {/* Flag 생성 모달 */}
      <CreateFlagModal
        isOpen={showCreateFlagModal}
        onClose={() => setShowCreateFlagModal(false)}
        workspaceId={workspaceId}
      />

      {/* Flag 수정 모달 */}
      <EditFlagModal
        isOpen={editingFlag !== null}
        onClose={() => setEditingFlag(null)}
        flag={editingFlag}
      />

      {/* readOnly 모드: Plan 보기 팝오버 */}
      {viewPopover && (
        <PlanViewPopover
          bar={viewPopover.bar}
          anchorPosition={viewPopover.position}
          onClose={() => setViewPopover(null)}
        />
      )}

      {/* ModuleSummaryBar 팝오버 */}
      {moduleSummaryPopover && moduleSummaryPopover.node.summary && (
        <ModuleSummaryBarPopover
          module={moduleSummaryPopover.node.label}
          project={moduleSummaryPopover.node.id.split("::")[0]}
          startDate={moduleSummaryPopover.node.summary.startDate}
          endDate={moduleSummaryPopover.node.summary.endDate}
          featureCount={moduleSummaryPopover.node.summary.featureCount}
          features={moduleSummaryPopover.node.summary.features}
          assignees={moduleSummaryPopover.node.summary.uniqueAssignees}
          flags={flags.filter(
            (flag) =>
              !flag.deleted &&
              moduleSummaryPopover.node.summary &&
              isDateRangeOverlapping(
                moduleSummaryPopover.node.summary.startDate,
                moduleSummaryPopover.node.summary.endDate,
                flag.startDate,
                flag.endDate
              )
          )}
          anchorRect={moduleSummaryPopover.anchorRect}
          onClose={() => setModuleSummaryPopover(null)}
        />
      )}
    </>
  );
}

