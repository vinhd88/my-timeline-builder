"use client";

import React, { useMemo } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { useThemeStore } from '@/store/themeStore';
import { differenceInDays, format, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { clsx } from 'clsx';
import { Flag, Pencil, Trash2 } from 'lucide-react';

const PIXELS_PER_DAY_MONTH_VIEW = 4;
const MONTH_WIDTH_WEEK_PART_VIEW = 240; // Fixed width for 4-week view (60px per week)

interface TimelineContainerProps {
    onMilestoneClick?: (milestone: any) => void;
    onRowEdit?: (row: any) => void;
    onRowDelete?: (rowId: string) => void;
}

export function TimelineContainer({ onMilestoneClick, onRowEdit, onRowDelete }: TimelineContainerProps) {
    const { rows, milestones, viewMode, startDate, endDate } = useTimelineStore();
    const { primaryColor, secondaryColor, accentColor, backgroundColor } = useThemeStore();

    const pixelsPerDay = viewMode === 'month' ? PIXELS_PER_DAY_MONTH_VIEW : 0;

    const months = useMemo(() => {
        return eachMonthOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const getDateX = (date: Date) => {
        if (viewMode === 'week-part') {
            const monthDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
            const daysInMonth = endOfMonth(date).getDate();
            const dayProgress = Math.min(Math.max(date.getDate() - 1, 0), daysInMonth) / daysInMonth;
            return (monthDiff * MONTH_WIDTH_WEEK_PART_VIEW) + (dayProgress * MONTH_WIDTH_WEEK_PART_VIEW);
        }

        const days = differenceInDays(date, startDate);
        return days * pixelsPerDay;
    };

    const getX = (date: Date) => Math.max(0, getDateX(date));

    const getWidth = (start: Date, end: Date) => {
        const startX = getDateX(start);
        const endX = getDateX(end);
        return Math.max(endX - startX, 2); // Min width 2px
    };

    const totalDays = differenceInDays(endDate, startDate);

    const totalWidth = viewMode === 'week-part'
        ? months.length * MONTH_WIDTH_WEEK_PART_VIEW
        : totalDays * pixelsPerDay;

    return (
        <div className="w-full h-full border rounded-lg shadow-sm bg-white overflow-auto font-sans relative">
            <div className="flex min-w-full h-full">
                {/* LEFT PANEL: Fixed Columns (Sticky Left) */}
                <div className="w-64 flex-shrink-0 border-r bg-white sticky left-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    {/* Sticky Header Group for Left Panel */}
                    <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
                        {/* Milestones Spacer */}
                        <div className="h-16 bg-white flex items-center px-4 text-xs font-medium text-gray-400">
                        </div>

                        {/* Header Alignment */}
                        <div className="h-10 bg-gray-50 flex items-center px-4 font-bold text-gray-700 text-sm border-t border-gray-100">
                            Project Items
                        </div>
                    </div>

                    {/* Rows List */}
                    <div className="py-2 space-y-1 bg-white">
                        {rows.map(row => {
                            // Calculate indentation based on indent level
                            const getIndentClass = () => {
                                if (row.type === 'phase') return '';
                                if (row.indent === 2) return 'pl-8'; // Level 3: 2rem indent
                                if (row.indent === 1) return 'pl-4'; // Level 2: 1rem indent
                                return '';
                            };

                            return (
                                <div
                                    key={row.id}
                                    className="h-10 flex items-center px-4 relative group hover:bg-gray-50 transition-colors"
                                    style={{ borderLeft: `4px solid ${row.type === 'phase' ? (row.color || primaryColor) : 'transparent'}` }}
                                >
                                    <span className={clsx("truncate block w-full", row.type === 'phase' ? "font-bold text-gray-900" : "text-sm text-gray-600", getIndentClass())}>
                                        {row.title}
                                    </span>

                                    {/* Edit/Delete Buttons - Show on hover */}
                                    <div className="absolute right-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {onRowEdit && (
                                            <button
                                                onClick={() => onRowEdit(row)}
                                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                                                title="Edit item"
                                            >
                                                <Pencil size={14} className="text-blue-600" />
                                            </button>
                                        )}
                                        {onRowDelete && (
                                            <button
                                                onClick={() => onRowDelete(row.id)}
                                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                                title="Delete item"
                                            >
                                                <Trash2 size={14} className="text-red-600" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Row Handle */}
                                    <div
                                        className={clsx(
                                            "absolute right-2 top-2 bottom-2 w-1.5 rounded-sm",
                                            row.type === 'phase' ? "" : "bg-gray-200"
                                        )}
                                        style={{ backgroundColor: row.type === 'phase' ? (row.color || primaryColor) : undefined }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT PANEL: Scrollable Timeline */}
                <div className="flex-1 relative">
                    <div className="relative min-h-full" style={{ width: `${totalWidth}px` }}>

                        {/* Sticky Header Group for Right Panel */}
                        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
                            {/* Milestones Area */}
                            <div className="relative h-16 bg-white">
                                {milestones.map(milestone => (
                                    <div
                                        key={milestone.id}
                                        className="absolute top-2 flex items-start group cursor-pointer hover:scale-105 transition-transform z-30"
                                        style={{ left: getX(new Date(milestone.date)) }}
                                        onClick={() => onMilestoneClick && onMilestoneClick(milestone)}
                                    >
                                        <div className="relative">
                                            <Flag
                                                fill={milestone.color || accentColor}
                                                color={milestone.color || accentColor}
                                                size={24}
                                            />
                                            {/* Line down - align with stem (approx 3px offset) */}
                                            <div
                                                className="absolute left-[3px] top-full w-0.5 bg-gray-300 h-[1000px] -ml-[1px]"
                                                style={{ pointerEvents: 'none', opacity: 0.5, borderLeft: '1px dashed' }}
                                            />
                                        </div>
                                        <div className="ml-2 bg-white/90 rounded-md p-1.5 border border-gray-100 shadow-sm text-xs font-medium backdrop-blur-sm -mt-0.5 min-w-[100px]">
                                            <div className="text-gray-900 leading-tight">{milestone.label}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">{format(new Date(milestone.date), 'd MMM yyyy')}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Header (Months) */}
                            <div className="relative">
                                {/* Month Row */}
                                <div className="relative h-10 bg-gray-50 text-sm font-semibold text-gray-700 block border-t border-gray-100">
                                    {months.map((month, index) => {
                                        const fixedMonthWidth = viewMode === 'week-part' ? MONTH_WIDTH_WEEK_PART_VIEW : 120;
                                        // For standard view, position might need adjustment if using fixed width per month, 
                                        // but original logic used getX(startOfMonth). 
                                        // Original logic for Standard Month View labels was fixed 120px... wait, let's keep original logic for Standard View.
                                        // The original logic used `index * fixedMonthWidth` which implies uniform width.
                                        // Let's use getX for Month View label positioning to be safe if widths vary (though months length varies slightly).
                                        // Actually, original code simplified to fixed 120px. Let's stick to that for now if it works, or clearer:

                                        const leftPosition = viewMode === 'week-part'
                                            ? index * MONTH_WIDTH_WEEK_PART_VIEW
                                            : index * 120; // Original constant

                                        return (
                                            <div
                                                key={month.toISOString()}
                                                className="absolute border-r flex items-center justify-center px-2 top-0 h-full overflow-hidden whitespace-nowrap"
                                                style={{
                                                    left: leftPosition,
                                                    width: viewMode === 'week-part' ? MONTH_WIDTH_WEEK_PART_VIEW : 120,
                                                    backgroundColor: secondaryColor,
                                                    color: '#fff'
                                                }}
                                            >
                                                {format(month, 'MMM yyyy')}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Sub-Header (Weeks) - Only in week-part mode */}
                                {viewMode === 'week-part' && (
                                    <div className="relative h-8 bg-gray-100 text-xs font-medium text-gray-500 block border-b border-gray-200">
                                        {months.map((month, monthIndex) => (
                                            <div key={'weeks-' + month.toISOString()} className="absolute top-0 h-full flex"
                                                style={{
                                                    left: monthIndex * MONTH_WIDTH_WEEK_PART_VIEW,
                                                    width: MONTH_WIDTH_WEEK_PART_VIEW
                                                }}
                                            >
                                                {[1, 2, 3, 4].map((week) => (
                                                    <div
                                                        key={`week-${week}`}
                                                        className="flex-1 border-r border-gray-200 flex items-center justify-center"
                                                    >
                                                        Week {week}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Rows Grid + Bars */}
                        <div className="relative py-2 space-y-1">
                            {/* Grid Background */}
                            <div className="absolute inset-0 z-0 pointer-events-none h-full">
                                {viewMode === 'week-part' ? (
                                    // Week-Part Grid (4 columns per month)
                                    months.map((month, index) => (
                                        <div key={'grid-' + month.toISOString()} className="absolute h-full flex top-0"
                                            style={{
                                                left: index * MONTH_WIDTH_WEEK_PART_VIEW,
                                                width: MONTH_WIDTH_WEEK_PART_VIEW
                                            }}
                                        >
                                            {[1, 2, 3, 4].map(w => (
                                                <div key={w} className="flex-1 h-full border-r border-gray-100" />
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    // Standard Month Grid (start of each month)
                                    months.map(month => (
                                        <div
                                            key={'grid-' + month.toISOString()}
                                            className="absolute h-full border-r border-gray-100"
                                            style={{ left: getX(startOfMonth(month)) }}
                                        />
                                    ))
                                )}
                            </div>

                            {rows.map((row) => {
                                const barStartX = getX(new Date(row.startDate));

                                return (
                                    <div
                                        key={row.id}
                                        className="relative h-10 hover:bg-gray-50 transition-colors group z-10"
                                    >
                                        {/* Dashed Arrow Line */}
                                        {barStartX > 0 && (
                                            <div
                                                className="absolute top-1/2 h-px -translate-y-1/2 z-0"
                                                style={{
                                                    left: 0,
                                                    width: barStartX,
                                                    borderTop: '2px dashed #cbd5e1' // slate-300
                                                }}
                                            >
                                                {/* Arrow Head */}
                                                <div
                                                    className="absolute right-0 top-1/2 -translate-y-1/2"
                                                    style={{
                                                        width: 0,
                                                        height: 0,
                                                        borderTop: '4px solid transparent',
                                                        borderBottom: '4px solid transparent',
                                                        borderLeft: '6px solid #cbd5e1', // slate-300
                                                        transform: 'translateX(50%)' // Center exactly on the line end/bar start
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Bar */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 h-6 rounded shadow-sm flex items-center px-2 text-xs text-white overflow-hidden whitespace-nowrap"
                                            style={{
                                                left: getX(new Date(row.startDate)),
                                                width: getWidth(new Date(row.startDate), new Date(row.endDate)),
                                                ...(row.type === 'phase'
                                                    ? { background: `linear-gradient(90deg, ${row.color || primaryColor} 0%, ${row.color || primaryColor}90 100%)` }
                                                    : { backgroundColor: row.color || secondaryColor }
                                                )
                                            }}
                                        >
                                            {row.progress > 0 && (
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 bg-black/10"
                                                    style={{ width: `${row.progress}%` }}
                                                />
                                            )}
                                            <span className="relative z-10 dropshadow-md">
                                                {row.progress > 0 ? `${row.progress}%` : ''}
                                            </span>
                                        </div>

                                        {/* Date Labels */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-400 ml-2 pointer-events-none whitespace-nowrap"
                                            style={{ left: getX(new Date(row.endDate)) + 5 }}
                                        >
                                            {format(new Date(row.startDate), 'd MMM')} - {format(new Date(row.endDate), 'd MMM')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
