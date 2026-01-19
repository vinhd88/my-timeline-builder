"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimelineRow } from "@/types/timeline";
import { useThemeStore } from "@/store/themeStore";
import { format } from "date-fns";

interface ProjectItemDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<TimelineRow, 'id'> | TimelineRow) => void;
    onDelete?: (id: string) => void;
    item?: TimelineRow;
}

export function ProjectItemDialog({ isOpen, onClose, onSave, onDelete, item }: ProjectItemDialogProps) {
    const { primaryColor, secondaryColor } = useThemeStore();
    const [title, setTitle] = useState("");
    const [level, setLevel] = useState<number>(2);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [color, setColor] = useState(secondaryColor);

    // Helper function to get level from item
    const getLevelFromItem = (item: TimelineRow): number => {
        if (item.type === 'phase' && item.indent === 0) return 1;
        if (item.type === 'task' && item.indent === 1) return 2;
        if (item.type === 'task' && item.indent === 2) return 3;
        return 2; // default
    };

    // Helper function to get default color based on level
    const getDefaultColor = (level: number) => {
        return level === 1 ? primaryColor : secondaryColor;
    };

    useEffect(() => {
        if (item) {
            setTitle(item.title);
            const itemLevel = getLevelFromItem(item);
            setLevel(itemLevel);
            setStartDate(format(new Date(item.startDate), 'yyyy-MM-dd'));
            setEndDate(format(new Date(item.endDate), 'yyyy-MM-dd'));
            setColor(item.color || getDefaultColor(itemLevel));
        } else {
            setTitle("New Task");
            setLevel(2); // Default to Level 2
            setStartDate(format(new Date(), 'yyyy-MM-dd'));
            const defaultEnd = new Date();
            defaultEnd.setDate(defaultEnd.getDate() + 7); // Default 1 week duration
            setEndDate(format(defaultEnd, 'yyyy-MM-dd'));
            setColor(getDefaultColor(2));
        }
    }, [item, isOpen, primaryColor, secondaryColor]);

    // Update color when level changes (only for new items)
    useEffect(() => {
        if (!item) {
            setColor(getDefaultColor(level));
        }
    }, [level, item, primaryColor, secondaryColor]);

    const handleSave = () => {
        if (!startDate || !endDate || !title.trim()) return;

        // Validate that end date is after start date
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            alert("End date must be after start date");
            return;
        }

        // Map level to type, indent, and isExpanded
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

        // Create payload
        const payload: any = {
            title: title.trim(),
            startDate: start,
            endDate: end,
            color,
            type,
            indent,
            progress: 0,
            isExpanded
        };

        if (item) {
            payload.id = item.id;
        }

        onSave(payload);
        onClose();
    };

    const handleDelete = () => {
        if (item && onDelete) {
            onDelete(item.id);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Project Item" : "Add Project Item"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Item Name</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="level" className="text-right">Level</Label>
                        <Select value={level.toString()} onValueChange={(value) => setLevel(parseInt(value))}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Level 1 - Top Parent (Phase)</SelectItem>
                                <SelectItem value="2">Level 2 - Child Task</SelectItem>
                                <SelectItem value="3">Level 3 - Sub-task</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startDate" className="text-right">Start Date</Label>
                        <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endDate" className="text-right">End Date</Label>
                        <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="color" className="text-right">Color</Label>
                        <div className="col-span-3 flex gap-2">
                            <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 p-1 h-10" />
                            <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex justify-between">
                    {item && onDelete && (
                        <Button type="button" variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    )}
                    <Button type="submit" onClick={handleSave}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
