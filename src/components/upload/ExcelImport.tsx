"use client";

import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { useTimelineStore } from '@/store/timelineStore';
import { useThemeStore } from '@/store/themeStore';
import { TimelineRow } from '@/types/timeline';

export function ExcelImport() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const setRows = useTimelineStore((state) => state.setRows);
    const setViewport = useTimelineStore((state) => state.setViewport);
    const clearMilestones = useTimelineStore((state) => state.clearMilestones);
    const { primaryColor, secondaryColor } = useThemeStore();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            parseExcel(file);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const parseExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            if (data) {
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                processData(jsonData);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const processData = (data: any[]) => {
        const newRows: TimelineRow[] = [];

        data.forEach((row: any) => {
            // Expected columns: "Project item", "Start Date", "End Date", "Level"

            const title = row['Project item'] || row['Project Item'] || 'Untitled';
            const rawStartDate = row['Start Date'];
            const rawEndDate = row['End Date'];
            const level = parseInt(row['Level'] || '2', 10);

            if (!rawStartDate || !rawEndDate) return;

            const startDate = new Date(rawStartDate);
            const endDate = new Date(rawEndDate);

            // Generate a random ID
            const id = Math.random().toString(36).substring(2, 9);

            let type: 'phase' | 'task' = 'task';
            let indent = 0;
            let isExpanded = undefined;

            if (level === 1) {
                type = 'phase';
                indent = 0;
                isExpanded = true;
            } else if (level === 2) {
                type = 'task';
                indent = 1;
            } else if (level === 3) {
                type = 'task';
                indent = 2;
            }

            const timelineRow: TimelineRow = {
                id,
                type,
                title,
                startDate,
                endDate,
                progress: 0, // Default to 0, or could read from excel if added later
                color: type === 'phase' ? primaryColor : secondaryColor,
                indent,
                isExpanded
            };

            console.log(`Creating row: ${title}, type: ${type}, color: ${timelineRow.color}, primaryColor: ${primaryColor}, secondaryColor: ${secondaryColor}`);

            newRows.push(timelineRow);
        });

        if (newRows.length > 0) {
            // Clear existing milestones when importing new data
            clearMilestones();

            setRows(newRows);
            console.log("Imported rows:", newRows);

            // Calculate min start and max end date
            let minDate = newRows[0].startDate;
            let maxDate = newRows[0].endDate;

            newRows.forEach(row => {
                if (row.startDate < minDate) minDate = row.startDate;
                if (row.endDate > maxDate) maxDate = row.endDate;
            });

            // Add 1 month buffer
            const newStart = new Date(minDate);
            newStart.setMonth(newStart.getMonth() - 1);

            const newEnd = new Date(maxDate);
            newEnd.setMonth(newEnd.getMonth() + 1);

            setViewport(newStart, newEnd);
        }
    };

    const handleDownloadTemplate = () => {
        // Create sample data with proper structure
        const sampleData = [
            {
                "Project item": "Project Phase 1",
                "Start Date": "2026-02-01",
                "End Date": "2026-04-30",
                "Level": 1
            },
            {
                "Project item": "Design & Planning",
                "Start Date": "2026-02-01",
                "End Date": "2026-02-28",
                "Level": 2
            },
            {
                "Project item": "Requirements Gathering",
                "Start Date": "2026-02-01",
                "End Date": "2026-02-15",
                "Level": 3
            },
            {
                "Project item": "UI/UX Design",
                "Start Date": "2026-02-16",
                "End Date": "2026-02-28",
                "Level": 3
            },
            {
                "Project item": "Development",
                "Start Date": "2026-03-01",
                "End Date": "2026-04-15",
                "Level": 2
            },
            {
                "Project item": "Testing & QA",
                "Start Date": "2026-04-16",
                "End Date": "2026-04-30",
                "Level": 2
            }
        ];

        // Create worksheet from sample data
        const worksheet = XLSX.utils.json_to_sheet(sampleData);

        // Create workbook and add worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Timeline Data");

        // Download the file
        XLSX.writeFile(workbook, "timeline_template.xlsx");
    };

    return (
        <>
            <Button
                variant="outline"
                className="gap-2"
                onClick={handleDownloadTemplate}
            >
                <Download size={16} /> Download Template
            </Button>
            <Button
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload size={16} /> Import Excel
            </Button>
            <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
        </>
    );
}
