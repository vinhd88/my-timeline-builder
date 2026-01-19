"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Milestone } from "@/types/timeline";
import { format } from "date-fns";

interface MilestoneDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (milestone: Omit<Milestone, 'id'> | Milestone) => void;
    milestone?: Milestone;
}

export function MilestoneDialog({ isOpen, onClose, onSave, milestone }: MilestoneDialogProps) {
    const [label, setLabel] = useState("");
    const [date, setDate] = useState("");
    const [color, setColor] = useState("#f59e0b");

    useEffect(() => {
        if (milestone) {
            setLabel(milestone.label);
            setDate(format(new Date(milestone.date), 'yyyy-MM-dd'));
            setColor(milestone.color || "#f59e0b");
        } else {
            setLabel("New Milestone");
            setDate(format(new Date(), 'yyyy-MM-dd'));
            setColor("#f59e0b");
        }
    }, [milestone, isOpen]);

    const handleSave = () => {
        if (!date || !label) return;

        // Create payload
        const payload: any = {
            label,
            date: new Date(date),
            color
        };

        if (milestone) {
            payload.id = milestone.id;
        }

        onSave(payload);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{milestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="label" className="text-right">Label</Label>
                        <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="color" className="text-right">Color</Label>
                        <div className="col-span-3 flex gap-2">
                            <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 p-1 h-10" />
                            <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
