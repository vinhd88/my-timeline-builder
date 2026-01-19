"use client";

import { useState } from "react";
import { ThemeUploader } from "@/components/upload/ThemeUploader";
import { TimelineContainer } from "@/components/timeline/TimelineContainer";
import { ExcelImport } from "@/components/upload/ExcelImport";
import { Button } from "@/components/ui/button";
import { Download, Plus, Layout, Palette } from "lucide-react";
import { exportToPPTX } from "@/lib/exportUtils";
import { useTimelineStore } from "@/store/timelineStore";
import { useThemeStore } from "@/store/themeStore";
import { MilestoneDialog } from "@/components/timeline/MilestoneDialog";
import { Milestone } from "@/types/timeline";

export default function Home() {
  const { rows, milestones, startDate, endDate, viewMode, setViewMode, addMilestone, updateMilestone } = useTimelineStore();
  const theme = useThemeStore();

  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | undefined>(undefined);

  const handleExport = () => {
    exportToPPTX(rows, milestones, theme, startDate, endDate);
  };

  const toggleView = () => {
    setViewMode(viewMode === 'day' ? 'month' : 'day');
  };

  const handleAddMilestone = () => {
    setEditingMilestone(undefined);
    setIsMilestoneDialogOpen(true);
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setIsMilestoneDialogOpen(true);
  };

  const handleSaveMilestone = (data: any) => {
    if (data.id) {
      updateMilestone(data.id, data);
    } else {
      addMilestone(data);
    }
  };

  return (
    <main className="h-screen p-4 bg-gray-50 flex flex-col overflow-hidden">
      <div className="w-full h-full flex flex-col space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 shrink-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Timeline Builder</h1>
            <p className="text-sm text-gray-500">Create beautiful project timelines</p>
          </div>
          <div className="flex gap-2">
            <ExcelImport />
            <Button variant="outline" onClick={() => setIsThemeDialogOpen(true)} className="gap-2">
              <Palette size={16} /> Theme
            </Button>
            <Button variant="outline" onClick={toggleView} className="gap-2">
              <Layout size={16} /> {viewMode === 'day' ? 'Month View' : 'Day View'}
            </Button>
            <Button variant="outline" onClick={handleAddMilestone} className="gap-2">
              <Plus size={16} /> Milestone
            </Button>
            <Button onClick={handleExport} className="gap-2">
              <Download size={16} /> Export PPTX
            </Button>
          </div>
        </div>

        {/* Timeline Area (Expanded) */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1 overflow-hidden relative">
          <TimelineContainer onMilestoneClick={handleMilestoneClick} />
        </div>

        <ThemeUploader
          isOpen={isThemeDialogOpen}
          onOpenChange={setIsThemeDialogOpen}
        />

        <MilestoneDialog
          isOpen={isMilestoneDialogOpen}
          onClose={() => setIsMilestoneDialogOpen(false)}
          onSave={handleSaveMilestone}
          milestone={editingMilestone}
        />
      </div>
    </main>
  );
}
