"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { House, Radio, Signal, Waves } from 'lucide-react';
import { AntennaType, AntennaPlacement } from '@/lib/api-config';

export type CellType = 'empty' | 'house' | 'antenna' | 'covered';

interface GridMapProps {
    rows: number;
    cols: number;
    grid: CellType[][];
    onCellClick: (row: number, col: number) => void;
    coverage: boolean[][];
    antennaData?: AntennaPlacement[];
}

export function GridMap({ rows, cols, grid, onCellClick, coverage, antennaData = [] }: GridMapProps) {
    // Find antenna at specific position
    const getAntennaAtPosition = (row: number, col: number): AntennaPlacement | undefined => {
        return antennaData.find(ant => ant.y === row && ant.x === col);
    };

    // Get antenna styling based on type
    const getAntennaStyles = (type: AntennaType) => {
        switch (type) {
            case 'small':
                return {
                    bg: 'bg-cyan-500',
                    border: 'border-cyan-400',
                    shadow: 'shadow-[0_0_20px_rgba(6,182,212,0.7)]',
                    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.5),0_0_40px_rgba(6,182,212,0.3)]',
                    text: 'text-cyan-100'
                };
            case 'medium':
                return {
                    bg: 'bg-blue-500',
                    border: 'border-blue-400',
                    shadow: 'shadow-[0_0_25px_rgba(59,130,246,0.7)]',
                    glow: 'shadow-[0_0_35px_rgba(59,130,246,0.5),0_0_45px_rgba(59,130,246,0.3)]',
                    text: 'text-blue-100'
                };
            case 'large':
                return {
                    bg: 'bg-purple-500',
                    border: 'border-purple-400',
                    shadow: 'shadow-[0_0_30px_rgba(168,85,247,0.8)]',
                    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.6),0_0_50px_rgba(168,85,247,0.4)]',
                    text: 'text-purple-100'
                };
        }
    };

    // Get antenna icon based on type
    const getAntennaIcon = (type: AntennaType) => {
        switch (type) {
            case 'small':
                return <Radio size={16} strokeWidth={2.5} />;
            case 'medium':
                return <Signal size={18} strokeWidth={2.5} />;
            case 'large':
                return <Waves size={20} strokeWidth={2.5} />;
        }
    };

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
                    const antennaInfo = cell === 'antenna' ? getAntennaAtPosition(r, c) : undefined;
                    const antennaStyles = antennaInfo ? getAntennaStyles(antennaInfo.type) : null;
                    
                    return (
                        <div
                            key={`${r}-${c}`}
                            onClick={() => onCellClick(r, c)}
                            className={cn(
                                "aspect-square rounded-md flex items-center justify-center cursor-pointer transition-all duration-300 border border-slate-800/50 hover:border-slate-600 relative",
                                cell === 'empty' && isCovered && "bg-emerald-900/20 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
                                cell === 'empty' && !isCovered && "bg-slate-900/50 hover:bg-slate-800",
                                cell === 'house' && isCovered && "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
                                cell === 'house' && !isCovered && "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
                                cell === 'antenna' && antennaStyles && `${antennaStyles.bg} ${antennaStyles.border} ${antennaStyles.glow} ${antennaStyles.text} z-10 scale-110 animate-pulse`
                            )}
                        >
                            {cell === 'house' && <House size={16} strokeWidth={2.5} />}
                            {cell === 'antenna' && antennaInfo && getAntennaIcon(antennaInfo.type)}
                            {cell === 'empty' && isCovered && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />}
                        </div>
                    );
                })
            ))}
        </div>
    );
}
