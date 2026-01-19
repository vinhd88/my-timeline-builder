export type TimelineItemType = 'phase' | 'task';

export interface TimelineRow {
    id: string;
    type: TimelineItemType;
    title: string;
    startDate: Date;
    endDate: Date;
    progress: number; // 0-100
    color?: string; // Optional override
    textColor?: string;
    indent?: number; // 0 for phases, 1 for tasks usually
    isExpanded?: boolean; // For phases
}

export interface Milestone {
    id: string;
    date: Date;
    label: string;
    color?: string;
}

export type ViewMode = 'day' | 'month' | 'quarter' | 'year';

export interface DragItem {
    type: 'row' | 'row-resize' | 'milestone';
    id: string;
    originalDate: Date;
}
