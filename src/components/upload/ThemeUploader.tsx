"use client";

import React, { useRef, useState } from 'react';
import ColorThief from 'colorthief';
import { useThemeStore } from '@/store/themeStore';
import { rgbToHex } from '@/lib/colorUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ThemeUploaderProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ThemeUploader({ isOpen, onOpenChange }: ThemeUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const { setTheme, primaryColor, secondaryColor, backgroundColor, accentColor } = useThemeStore();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setTimeout(() => extractColors(url), 100);
        }
    };

    const extractColors = (url: string) => {
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;

        img.onload = () => {
            const colorThief = new ColorThief();
            try {
                const result = colorThief.getPalette(img, 5);
                if (result && result.length >= 4) {
                    const colors = result.map(c => rgbToHex(c[0], c[1], c[2]));

                    setTheme({
                        primaryColor: colors[0],
                        secondaryColor: colors[1],
                        accentColor: colors[2],
                    });
                }
            } catch (error) {
                console.error("Error extracting colors", error);
            }
        };
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Theme Setup</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previewUrl}
                                    alt="Uploaded preview"
                                    className="max-h-48 mx-auto rounded shadow-sm"
                                    ref={imgRef}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-white rounded-full shadow hover:bg-red-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewUrl(null);
                                        setTheme({
                                            primaryColor: '#3b82f6',
                                            secondaryColor: '#64748b'
                                        });
                                    }}
                                >
                                    <X className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-400">
                                <Upload className="w-8 h-8 mb-2" />
                                <p className="text-sm">Click to upload sample image</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setTheme({ primaryColor: e.target.value })}
                                    className="w-12 p-1 h-10"
                                />
                                <Input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setTheme({ primaryColor: e.target.value })}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={secondaryColor}
                                    onChange={(e) => setTheme({ secondaryColor: e.target.value })}
                                    className="w-12 p-1 h-10"
                                />
                                <Input
                                    type="text"
                                    value={secondaryColor}
                                    onChange={(e) => setTheme({ secondaryColor: e.target.value })}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Accent Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) => setTheme({ accentColor: e.target.value })}
                                    className="w-12 p-1 h-10"
                                />
                                <Input
                                    type="text"
                                    value={accentColor}
                                    onChange={(e) => setTheme({ accentColor: e.target.value })}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Background</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setTheme({ backgroundColor: e.target.value })}
                                    className="w-12 p-1 h-10"
                                />
                                <Input
                                    type="text"
                                    value={backgroundColor}
                                    onChange={(e) => setTheme({ backgroundColor: e.target.value })}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
