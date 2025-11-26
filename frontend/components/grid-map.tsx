"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { House, Radio } from 'lucide-react';

export type CellType = 'empty' | 'house' | 'antenna' | 'covered';

interface GridMapProps {
    rows: number;
    cols: number;
    grid: CellType[][];
    onCellClick: (row: number, col: number) => void;
    coverage: boolean[][];
}

export function GridMap({ rows, cols, grid, onCellClick, coverage }: GridMapProps) {
    // We'll use a canvas for performance if grid is large, but for < 50x50 divs are fine and easier to style.
    // Let's stick to divs for "premium" look with animations.

    return (
        <div
            className="grid gap-1 p-4 glass-panel rounded-xl overflow-auto max-h-[70vh] max-w-full"
            style={{
                gridTemplateColumns: `repeat(${cols}, minmax(2rem, 1fr))`,
            }}
        >
            {grid.map((row, r) => (
                row.map((cell, c) => {
                    const isCovered = coverage[r]?.[c];
                    return (
                        <div
                            key={`${r}-${c}`}
                            onClick={() => onCellClick(r, c)}
                            className={cn(
                                "aspect-square rounded-md flex items-center justify-center cursor-pointer transition-all duration-300 border border-slate-800/50 hover:border-slate-600",
                                cell === 'empty' && isCovered && "bg-emerald-900/20 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
                                cell === 'empty' && !isCovered && "bg-slate-900/50 hover:bg-slate-800",
                                cell === 'house' && isCovered && "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
                                cell === 'house' && !isCovered && "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
                                cell === 'antenna' && "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] z-10 scale-110 border-blue-400"
                            )}
                        >
                            {cell === 'house' && <House size={16} strokeWidth={2.5} />}
                            {cell === 'antenna' && <Radio size={18} strokeWidth={2.5} />}
                            {cell === 'empty' && isCovered && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />}
                        </div>
                    );
                })
            ))}
        </div>
    );
}
