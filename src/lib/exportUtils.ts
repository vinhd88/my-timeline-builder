import pptxgen from "pptxgenjs";
import { TimelineRow, Milestone, ViewMode } from "@/types/timeline";
import { ThemeState } from "@/store/themeStore";
import { format, differenceInDays, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";

export const exportToPPTX = (
    rows: TimelineRow[],
    milestones: Milestone[],
    theme: ThemeState,
    startDate: Date,
    endDate: Date,
    viewMode: ViewMode
) => {
    const pres = new pptxgen();
    const slide = pres.addSlide();

    // --- CONFIGURATION ---
    const TOTAL_WIDTH_INCHES = 10;
    const LEFT_PANEL_WIDTH = 1.8;
    const GRAPH_START_X = LEFT_PANEL_WIDTH + 0.15;
    const GRAPH_WIDTH = TOTAL_WIDTH_INCHES - GRAPH_START_X - 0.15;
    const MILESTONE_AREA_HEIGHT = 0.65;
    const HEADER_Y = 0.7 + MILESTONE_AREA_HEIGHT;

    // Adjust header height based on view mode (taller for week-part to fit sub-headers)
    const MONTH_HEADER_HEIGHT = 0.30;
    const SUB_HEADER_HEIGHT = viewMode === 'week-part' ? 0.20 : 0;
    const TOTAL_HEADER_HEIGHT = MONTH_HEADER_HEIGHT + SUB_HEADER_HEIGHT;

    const ROW_START_Y = HEADER_Y + TOTAL_HEADER_HEIGHT + 0.05;
    const ROW_HEIGHT_INCHES = 0.22;
    const TEXT_COLOR = theme.textColor.replace('#', '');
    const BG_COLOR = theme.backgroundColor.replace('#', '');

    // Background
    slide.background = { color: BG_COLOR };

    // --- TITLE ---
    slide.addText("Project Timeline", {
        x: 0.2, y: 0.25, fontSize: 14, fontFace: "Arial", bold: true, color: theme.primaryColor.replace('#', '')
    });

    // --- UTILS ---
    const totalDays = differenceInDays(endDate, startDate);
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const monthWidth = GRAPH_WIDTH / months.length; // Equal width for all months in week-part (and typically standard too in clean exports, but let's see logic)

    const getX = (date: Date) => {
        if (viewMode === 'week-part') {
            // Proportional mapping based on months
            const monthDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
            const daysInMonth = endOfMonth(date).getDate();
            const dayProgress = Math.min(Math.max(date.getDate() - 1, 0), daysInMonth) / daysInMonth;

            // Calculate X based on month index + proportion within month
            const x = GRAPH_START_X + (monthDiff * monthWidth) + (dayProgress * monthWidth);

            // Clamp to graph bounds
            if (x < GRAPH_START_X) return GRAPH_START_X;
            if (x > GRAPH_START_X + GRAPH_WIDTH) return GRAPH_START_X + GRAPH_WIDTH;
            return x;
        }

        // Standard linear time mapping
        let days = differenceInDays(date, startDate);
        if (days < 0) days = 0;
        if (days > totalDays) days = totalDays;
        return GRAPH_START_X + (days / totalDays) * GRAPH_WIDTH;
    };

    const getY = (rowIndex: number) => {
        return ROW_START_Y + (rowIndex * ROW_HEIGHT_INCHES);
    };

    // --- MILESTONES (Above header) ---
    milestones.forEach((m) => {
        const mDate = new Date(m.date);
        if (mDate < startDate || mDate > endDate) return;

        const x = getX(mDate);
        const color = m.color ? m.color.replace('#', '') : theme.accentColor.replace('#', '');

        // Flag icon (pointing right)
        slide.addShape(pres.ShapeType.triangle, {
            x: x - 0.08, y: 0.78, w: 0.15, h: 0.15,
            fill: { color: color },
            line: { width: 0 },
            rotate: 90
        });

        // Milestone label (to the right of flag)
        slide.addText(m.label, {
            x: x + 0.1, y: 0.75, w: 1.0, h: 0.1,
            fontSize: 7.5, align: 'left', color: '111827', bold: true
        });

        // Date (below label)
        slide.addText(format(mDate, 'd MMM yyyy'), {
            x: x + 0.1, y: 0.86, w: 1.0, h: 0.08,
            fontSize: 6, align: 'left', color: '6B7280'
        });

        // Dashed vertical line from milestone down through all rows
        const lineEndY = getY(rows.length) + 0.1;
        slide.addShape(pres.ShapeType.line, {
            x: x, y: 0.95, w: 0, h: lineEndY - 0.95,
            line: { color: 'D1D5DB', width: 0.5, dashType: 'dash' }
        });
    });

    // --- MONTH HEADERS ---
    // months constant defined in UTILS now
    // monthWidth defined in UTILS now

    months.forEach((month, index) => {
        const x = GRAPH_START_X + (index * monthWidth);

        // Month header cell with secondaryColor background
        slide.addShape(pres.ShapeType.rect, {
            x: x, y: HEADER_Y, w: monthWidth, h: MONTH_HEADER_HEIGHT,
            fill: { color: theme.secondaryColor.replace('#', '') },
            line: { color: 'FFFFFF', width: 0.5 }
        });

        // Month text (white)
        slide.addText(format(month, 'MMM yyyy'), {
            x: x, y: HEADER_Y, w: monthWidth, h: MONTH_HEADER_HEIGHT,
            fontSize: 8, align: 'center', color: 'FFFFFF',
            valign: 'middle', bold: true
        });

        // Week Sub-headers (only if week-part)
        if (viewMode === 'week-part') {
            const weekWidth = monthWidth / 4;
            const subHeaderY = HEADER_Y + MONTH_HEADER_HEIGHT;

            for (let i = 0; i < 4; i++) {
                const wx = x + (i * weekWidth);

                // Week cell
                slide.addShape(pres.ShapeType.rect, {
                    x: wx, y: subHeaderY, w: weekWidth, h: SUB_HEADER_HEIGHT,
                    fill: { color: 'F3F4F6' }, // gray-100
                    line: { color: 'E5E7EB', width: 0.5 } // gray-200
                });

                // Week text
                slide.addText(`Week ${i + 1}`, {
                    x: wx, y: subHeaderY, w: weekWidth, h: SUB_HEADER_HEIGHT,
                    fontSize: 6, align: 'center', color: '6B7280', // gray-500
                    valign: 'middle'
                });

                // Vertical Grid Line for this week (except first one which is month start)
                if (i > 0) {
                    const gridEndY = getY(rows.length) + 0.1;
                    // Grid line start Y is below the total header
                    const gridY = HEADER_Y + TOTAL_HEADER_HEIGHT;

                    slide.addShape(pres.ShapeType.line, {
                        x: wx, y: gridY, w: 0, h: gridEndY - gridY,
                        line: { color: 'F3F4F6', width: 0.5 } // very light gray for weeks
                    });
                }
            }
        }

        // Vertical Grid Line (Month Start - stronger line)
        const gridEndY = getY(rows.length) + 0.1;
        // The month grid line starts below the month header (or sub header matches total height)
        // Actually, let's have it run through the rows area only
        const gridY = HEADER_Y + TOTAL_HEADER_HEIGHT;

        slide.addShape(pres.ShapeType.line, {
            x: x, y: gridY, w: 0, h: gridEndY - gridY,
            line: { color: 'E5E7EB', width: 0.75 }
        });
    });

    // --- LEFT PANEL HEADER ---
    slide.addText("Project Items", {
        x: 0.1, y: HEADER_Y, w: LEFT_PANEL_WIDTH, h: TOTAL_HEADER_HEIGHT,
        fontSize: 9, bold: true, color: '374151', valign: 'middle'
    });

    // Separator Line between Left Panel and Graph
    const listEndY = getY(rows.length);
    slide.addShape(pres.ShapeType.line, {
        x: GRAPH_START_X - 0.05, y: HEADER_Y, w: 0, h: listEndY - HEADER_Y,
        line: { color: 'D1D5DB', width: 1 }
    });

    // --- ROWS ---
    rows.forEach((row, index) => {
        const rowY = getY(index);
        const isPhase = row.type === 'phase';

        // Calculate indent based on row.indent property
        let indent = 0;
        if (!isPhase) {
            if (row.indent === 2) {
                indent = 0.24; // Level 3: double indent
            } else if (row.indent === 1) {
                indent = 0.12; // Level 2: single indent
            }
        }

        // Left border indicator (vertical pill)
        const indicatorColor = row.color ? row.color.replace('#', '') :
            (isPhase ? theme.primaryColor.replace('#', '') : theme.secondaryColor.replace('#', ''));

        slide.addShape(pres.ShapeType.rect, {
            x: 0.05, y: rowY + 0.03, w: 0.05, h: 0.2,
            fill: { color: indicatorColor },
            line: { type: 'none' }
        });

        // Task name
        slide.addText(row.title, {
            x: 0.12 + indent, y: rowY + 0.02, w: LEFT_PANEL_WIDTH - 0.12 - indent, h: 0.22,
            fontSize: isPhase ? 8.5 : 7.5,
            bold: isPhase,
            color: isPhase ? '111827' : '4B5563'
        });

        // Timeline Bar
        const barStart = new Date(row.startDate);
        const barEnd = new Date(row.endDate);

        if (barEnd < startDate || barStart > endDate) return;

        const x = getX(barStart);
        let w = getX(barEnd) - x;
        if (w < 0.08) w = 0.08;

        // Dashed connection line
        slide.addShape(pres.ShapeType.line, {
            x: LEFT_PANEL_WIDTH + 0.05, y: rowY + 0.13, w: x - (LEFT_PANEL_WIDTH + 0.05), h: 0,
            line: { color: 'D1D5DB', width: 0.5, dashType: 'dash' }
        });

        // Determine bar color and transparency
        let barColor = theme.secondaryColor.replace('#', '');
        let barTransparency = 0;

        if (row.color) {
            barColor = row.color.replace('#', '');
        } else if (isPhase) {
            barColor = theme.primaryColor.replace('#', '');
        } else {
            barColor = theme.secondaryColor.replace('#', '');
            barTransparency = 50;
        }

        // Main Bar (background - semi-transparent for tasks)
        slide.addShape(pres.ShapeType.rect, {
            x: x, y: rowY + 0.06, w: w, h: 0.16,
            fill: { color: barColor, transparency: barTransparency },
            line: { type: 'none' }
        });

        // Progress overlay (solid color)
        if (row.progress > 0) {
            const progressW = w * (row.progress / 100);
            if (progressW > 0.01) {
                slide.addShape(pres.ShapeType.rect, {
                    x: x, y: rowY + 0.06, w: progressW, h: 0.16,
                    fill: { color: barColor },
                    line: { type: 'none' }
                });

                // Progress percentage text (inside bar)
                if (progressW > 0.2) {
                    slide.addText(`${row.progress}%`, {
                        x: x, y: rowY + 0.06, w: progressW, h: 0.16,
                        fontSize: 6, color: 'FFFFFF', align: 'center', valign: 'middle', bold: true
                    });
                }
            }
        }

        // Date range text (to the right of bar)
        const dateText = `${format(barStart, 'd MMM')} - ${format(barEnd, 'd MMM')}`;
        slide.addText(dateText, {
            x: x + w + 0.05, y: rowY + 0.06, w: 1.0, h: 0.16,
            fontSize: 6, color: '9CA3AF', valign: 'middle'
        });
    });

    pres.writeFile({ fileName: "Timeline_Export.pptx" });
};
