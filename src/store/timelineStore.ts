import { create } from 'zustand';
import { TimelineRow, Milestone, ViewMode } from '@/types/timeline';
import { addDays, addMonths, startOfMonth } from 'date-fns';

interface TimelineState {
    rows: TimelineRow[];
    milestones: Milestone[];
    viewMode: ViewMode;
    startDate: Date; // Viewport start
    endDate: Date;   // Viewport end

    // Actions
    addRow: (row: Omit<TimelineRow, 'id'>) => void;
    updateRow: (id: string, updates: Partial<TimelineRow>) => void;
    deleteRow: (id: string) => void;
    reorderRows: (startIndex: number, endIndex: number) => void;

    addMilestone: (milestone: Omit<Milestone, 'id'>) => void;
    updateMilestone: (id: string, updates: Partial<Milestone>) => void;
    deleteMilestone: (id: string) => void;
    clearMilestones: () => void;

    setViewMode: (mode: ViewMode) => void;
    setViewport: (start: Date, end: Date) => void;
    setRows: (rows: TimelineRow[]) => void;
}

const generateMockData = (): { rows: TimelineRow[], milestones: Milestone[] } => {
    const today = new Date();
    const rows: TimelineRow[] = [
        {
            id: '1',
            type: 'phase',
            title: 'PHASE 1 (Planning)',
            startDate: startOfMonth(today),
            endDate: addMonths(startOfMonth(today), 2),
            progress: 45,
            indent: 0,
            isExpanded: true
        },
        {
            id: '2',
            type: 'task',
            title: 'Requirement Gathering',
            startDate: addDays(startOfMonth(today), 5),
            endDate: addDays(startOfMonth(today), 15),
            progress: 100,
            indent: 1
        },
        {
            id: '3',
            type: 'task',
            title: 'Design Mockups',
            startDate: addDays(startOfMonth(today), 12),
            endDate: addMonths(startOfMonth(today), 1),
            progress: 60,
            indent: 1
        },
        {
            id: '4',
            type: 'phase',
            title: 'PHASE 2 (Development)',
            startDate: addMonths(startOfMonth(today), 2),
            endDate: addMonths(startOfMonth(today), 5),
            progress: 10,
            indent: 0,
            isExpanded: true
        },
    ];

    const milestones: Milestone[] = [
        {
            id: 'm1',
            date: addDays(startOfMonth(today), 15),
            label: 'Design Approval'
        },
        {
            id: 'm2',
            date: addMonths(startOfMonth(today), 2),
            label: 'Phase 1 Sign-off'
        }
    ];

    return { rows, milestones };
}

const { rows: initialRows, milestones: initialMilestones } = generateMockData();

export const useTimelineStore = create<TimelineState>((set) => ({
    rows: initialRows,
    milestones: initialMilestones,
    viewMode: 'month',
    startDate: addMonths(new Date(), -1),
    endDate: addMonths(new Date(), 6),

    addRow: (row) => set((state) => ({
        rows: [...state.rows, { ...row, id: Math.random().toString(36).substr(2, 9) }]
    })),

    updateRow: (id, updates) => set((state) => ({
        rows: state.rows.map(row => row.id === id ? { ...row, ...updates } : row)
    })),

    deleteRow: (id) => set((state) => ({
        rows: state.rows.filter(row => row.id !== id)
    })),

    reorderRows: (start, end) => set((state) => {
        const result = Array.from(state.rows);
        const [removed] = result.splice(start, 1);
        result.splice(end, 0, removed);
        return { rows: result };
    }),

    addMilestone: (milestone) => set((state) => ({
        milestones: [...state.milestones, { ...milestone, id: Math.random().toString(36).substr(2, 9) }]
    })),

    updateMilestone: (id, updates) => set((state) => ({
        milestones: state.milestones.map(m => m.id === id ? { ...m, ...updates } : m)
    })),

    deleteMilestone: (id) => set((state) => ({
        milestones: state.milestones.filter(m => m.id !== id)
    })),

    clearMilestones: () => set({ milestones: [] }),

    setViewMode: (mode) => set({ viewMode: mode }),

    setViewport: (start, end) => set({ startDate: start, endDate: end }),

    setRows: (rows) => set({ rows }),
}));
