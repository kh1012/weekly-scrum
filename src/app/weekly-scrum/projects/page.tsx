"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { ProjectGroupView } from "@/components/weekly-scrum/projects/ProjectGroupView";

export default function ProjectsPage() {
  const { filteredItems } = useScrumContext();

  return <ProjectGroupView items={filteredItems} />;
}

