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
    const { primaryColor, secondaryColor, tertiaryColor } = useThemeStore();

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
                // Read without cellDates to keep serial numbers initially
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON with forced date formatting
                // raw: false ensures we get strings matching the dateNF format
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false,
                    dateNF: 'yyyy-mm-dd'
                });

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

            // Parse date strings "YYYY-MM-DD" directly
            // This is robust because it bypasses Excel serial->Date conversion ambiguities
            const parseDateString = (dateStr: string): Date | null => {
                console.log('Parsing date string:', dateStr);
                if (typeof dateStr !== 'string') {
                    // Fallback if something weird happened and we got a number/object
                    // (Shouldn't happen with raw: false, but good safety)
                    console.warn('Expected string date, got:', typeof dateStr, dateStr);
                    try {
                        return new Date(dateStr);
                    } catch (e) {
                        return null;
                    }
                }

                const cleanStr = dateStr.trim();

                // 1. Try YYYY-MM-DD (Standard ISO)
                if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanStr)) {
                    const [y, m, d] = cleanStr.split('-').map(Number);
                    return new Date(y, m - 1, d, 12, 0, 0, 0);
                }

                // 2. Try DD-MMM-YYYY (e.g. 20-Jan-2026)
                // Case-insensitive match for month names
                const mmmMatch = cleanStr.match(/^(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{4})$/i);
                if (mmmMatch) {
                    const d = parseInt(mmmMatch[1], 10);
                    const mStr = mmmMatch[2].toLowerCase();
                    const y = parseInt(mmmMatch[3], 10);

                    const months: { [key: string]: number } = {
                        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
                        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
                    };
                    return new Date(y, months[mStr], d, 12, 0, 0, 0);
                }

                // 3. Try Slash Formats: DD/MM/YYYY or MM/DD/YYYY
                const slashParts = cleanStr.split('/');
                if (slashParts.length === 3) {
                    const v1 = parseInt(slashParts[0], 10);
                    const v2 = parseInt(slashParts[1], 10);
                    const y = parseInt(slashParts[2], 10);

                    if (!isNaN(v1) && !isNaN(v2) && !isNaN(y)) {
                        // Logic to distinguish DD/MM vs MM/DD

                        // If 2nd part > 12, it MUST be the Day -> MM/DD/YYYY
                        // (Because Month cannot be > 12)
                        if (v2 > 12) {
                            // MM/DD/YYYY: v1 = Month, v2 = Day
                            return new Date(y, v1 - 1, v2, 12, 0, 0, 0);
                        }

                        // If 1st part > 12, it MUST be the Day -> DD/MM/YYYY
                        // (Because Month cannot be > 12)
                        if (v1 > 12) {
                            // DD/MM/YYYY: v1 = Day, v2 = Month
                            return new Date(y, v2 - 1, v1, 12, 0, 0, 0);
                        }

                        // If both are <= 12, it is ambiguous (e.g. 01/05/2026).
                        // Supported formats priority:
                        // 1. DD-MMM-YYYY
                        // 2. DD/MM/YYYY  <-- We prioritize this
                        // 3. MM/DD/YYYY

                        // Default to DD/MM/YYYY
                        return new Date(y, v2 - 1, v1, 12, 0, 0, 0);
                    }
                }

                // Fallback for other formats supported natively
                return new Date(dateStr);
            };

            const startDate = parseDateString(rawStartDate);
            const endDate = parseDateString(rawEndDate);

            if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.error('Invalid date parsed:', { rawStartDate, rawEndDate, startDate, endDate });
                return;
            }

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

            let color: string;
            if (type === 'phase') {
                color = primaryColor;
            } else if (level === 3) {
                color = tertiaryColor;
            } else {
                color = secondaryColor;
            }

            const timelineRow: TimelineRow = {
                id,
                type,
                title,
                startDate,
                endDate,
                progress: 0, // Default to 0, or could read from excel if added later
                color,
                indent,
                isExpanded
            };

            console.log(`Creating row: ${title}, dates: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);

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
