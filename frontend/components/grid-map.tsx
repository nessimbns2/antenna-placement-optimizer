"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { House, Radio, Signal, Waves, Antenna } from "lucide-react";
import { AntennaType, AntennaPlacement } from "@/lib/api-config";

export type CellType = "empty" | "house" | "antenna" | "covered";

interface GridMapProps {
  rows: number;
  cols: number;
  grid: CellType[][];
  onCellClick: (row: number, col: number) => void;
  coverage: boolean[][];
  antennaData?: AntennaPlacement[];
  selectedAntennaType?: AntennaType;
  manualAntennas?: Map<string, AntennaType>;
  antennaSpecs?: {
    type: AntennaType;
    radius: number;
    max_users: number;
    cost: number;
  }[];
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
}

export function GridMap({
  rows,
  cols,
  grid,
  onCellClick,
  coverage,
  antennaData = [],
  selectedAntennaType = "Pico",
  manualAntennas = new Map(),
  antennaSpecs = [],
  isFullscreen = false,
  onExitFullscreen,
}: GridMapProps) {
  // Adaptive cell size based on grid dimensions
  const cellSize = useMemo(() => {
    const maxDimension = Math.max(rows, cols);
    if (maxDimension > 500) return 8; // Tiny cells for huge grids
    if (maxDimension > 200) return 12; // Small cells for large grids
    if (maxDimension > 100) return 20; // Medium cells
    if (maxDimension > 50) return 30; // Standard cells
    return 40; // Large cells for small grids
  }, [rows, cols]);

  const isLargeGrid = rows * cols > 10000; // 100x100 threshold

  // Find antenna at specific position
  const getAntennaAtPosition = (
    row: number,
    col: number
  ): AntennaPlacement | undefined => {
    return antennaData.find((ant) => ant.y === row && ant.x === col);
  };

  // Get antenna styling based on type
  const getAntennaStyles = (type: AntennaType) => {
    switch (type) {
      case "Femto":
        return {
          bg: "bg-red-500",
          border: "border-red-400",
          shadow: "shadow-[0_0_20px_rgba(239,68,68,0.7)]",
          glow: "shadow-[0_0_30px_rgba(239,68,68,0.5),0_0_40px_rgba(239,68,68,0.3)]",
          text: "text-red-100",
          color: "#ef4444",
          coverageFill: "rgba(239, 68, 68, 0.12)",
          coverageStroke: "rgba(239, 68, 68, 0.5)",
        };
      case "Pico":
        return {
          bg: "bg-blue-500",
          border: "border-blue-400",
          shadow: "shadow-[0_0_25px_rgba(59,130,246,0.7)]",
          glow: "shadow-[0_0_35px_rgba(59,130,246,0.5),0_0_45px_rgba(59,130,246,0.3)]",
          text: "text-blue-100",
          color: "#3b82f6",
          coverageFill: "rgba(59, 130, 246, 0.12)",
          coverageStroke: "rgba(59, 130, 246, 0.5)",
        };
      case "Micro":
        return {
          bg: "bg-purple-500",
          border: "border-purple-400",
          shadow: "shadow-[0_0_30px_rgba(168,85,247,0.8)]",
          glow: "shadow-[0_0_40px_rgba(168,85,247,0.6),0_0_50px_rgba(168,85,247,0.4)]",
          text: "text-purple-100",
          color: "#a855f7",
          coverageFill: "rgba(168, 85, 247, 0.12)",
          coverageStroke: "rgba(168, 85, 247, 0.5)",
        };
      case "Macro":
        return {
          bg: "bg-green-500",
          border: "border-green-400",
          shadow: "shadow-[0_0_35px_rgba(34,197,94,0.8)]",
          glow: "shadow-[0_0_45px_rgba(34,197,94,0.6),0_0_55px_rgba(34,197,94,0.4)]",
          text: "text-green-100",
          color: "#22c55e",
          coverageFill: "rgba(34, 197, 94, 0.12)",
          coverageStroke: "rgba(34, 197, 94, 0.5)",
        };
    }
  }; // Get antenna icon based on type
  const getAntennaIcon = (type: AntennaType) => {
    switch (type) {
      case "Femto":
        return <Radio size={14} strokeWidth={2.5} />;
      case "Pico":
        return <Signal size={16} strokeWidth={2.5} />;
      case "Micro":
        return <Waves size={18} strokeWidth={2.5} />;
      case "Macro":
        return <Antenna size={20} strokeWidth={2.5} />;
    }
  };

  // Collect all antennas for rendering circles
  const allAntennasForCircles = useMemo(() => {
    const all: AntennaPlacement[] = [...antennaData];

    manualAntennas.forEach((type, key) => {
      const [r, c] = key.split(",").map(Number);
      const spec = antennaSpecs.find((s) => s.type === type);
      if (spec) {
        all.push({
          x: c,
          y: r,
          type: type,
          radius: spec.radius,
          max_users: spec.max_users,
          cost: spec.cost,
        });
      }
    });

    return all;
  }, [antennaData, manualAntennas, antennaSpecs]);

  return (
    <div className="relative glass-panel rounded-xl p-4 overflow-hidden">
      <div className="relative overflow-auto max-h-[800px]">
        <div
          className="relative"
          style={{
            width: isLargeGrid
              ? cols * cellSize + cols
              : cols * cellSize + (cols - 1) * 4,
            height: isLargeGrid
              ? rows * cellSize + rows
              : rows * cellSize + (rows - 1) * 4,
          }}
        >
          {/* SVG Overlay for coverage circles */}
          <svg
            className="absolute pointer-events-none"
            style={{
              width: isLargeGrid
                ? cols * cellSize + cols
                : cols * cellSize + (cols - 1) * 4,
              height: isLargeGrid
                ? rows * cellSize + rows
                : rows * cellSize + (rows - 1) * 4,
              left: 0,
              top: 0,
            }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Draw individual antenna coverage circles with antenna colors */}
            {allAntennasForCircles.map((antenna, idx) => {
              // Account for grid gap (gap-1 = 4px in Tailwind)
              const gap = isLargeGrid ? 1 : 4;
              const centerX = antenna.x * (cellSize + gap) + cellSize / 2;
              const centerY = antenna.y * (cellSize + gap) + cellSize / 2;
              // Backend returns radius in cells, multiply by cellSize + gap for visual radius
              const radiusInCells = antenna.radius;
              const radius = radiusInCells * (cellSize + gap);

              // Get antenna-specific colors
              const antennaStyles = getAntennaStyles(antenna.type);

              return (
                <circle
                  key={`antenna-circle-${antenna.x}-${antenna.y}-${idx}`}
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill={antennaStyles.coverageFill}
                  stroke={antennaStyles.coverageStroke}
                  strokeWidth="3"
                  strokeDasharray="8,6"
                />
              );
            })}
          </svg>

          {/* Grid cells */}
          <div
            className={isLargeGrid ? "grid" : "grid gap-1"}
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              gap: isLargeGrid ? "1px" : undefined,
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isCovered = coverage[r]?.[c];
                const antennaInfo =
                  cell === "antenna" ? getAntennaAtPosition(r, c) : undefined;

                // Use antenna info from optimization, or manual placement map, or fallback to selected type
                const key = `${r},${c}`;
                const antennaType =
                  antennaInfo?.type ||
                  (cell === "antenna" ? manualAntennas.get(key) : undefined);
                const antennaStyles = antennaType
                  ? getAntennaStyles(antennaType)
                  : null;

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => onCellClick(r, c)}
                    className={cn(
                      "flex items-center justify-center cursor-pointer",
                      isLargeGrid
                        ? "border-slate-800/30"
                        : "rounded-md border border-slate-800/50 hover:border-slate-600 relative transition-all duration-300",
                      cell === "empty" &&
                        !isCovered &&
                        (isLargeGrid
                          ? "bg-slate-900"
                          : "bg-slate-900/50 hover:bg-slate-800"),
                      cell === "house" &&
                        isCovered &&
                        (isLargeGrid
                          ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-400"
                          : "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"),
                      cell === "house" &&
                        !isCovered &&
                        (isLargeGrid
                          ? "bg-rose-500/30 border-rose-500/50 text-rose-400"
                          : "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]"),
                      cell === "antenna" &&
                        antennaStyles &&
                        (isLargeGrid
                          ? `${antennaStyles.bg} ${antennaStyles.border} ${antennaStyles.text} z-10`
                          : `${antennaStyles.bg} ${antennaStyles.border} ${antennaStyles.glow} ${antennaStyles.text} z-10`)
                    )}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                    }}
                  >
                    {cell === "house" && !isLargeGrid && (
                      <House
                        size={Math.max(8, cellSize * 0.4)}
                        strokeWidth={2.5}
                      />
                    )}
                    {cell === "house" && isLargeGrid && cellSize >= 12 && (
                      <House size={8} strokeWidth={3} />
                    )}
                    {cell === "antenna" &&
                      antennaType &&
                      !isLargeGrid &&
                      getAntennaIcon(antennaType)}
                    {cell === "antenna" &&
                      antennaType &&
                      isLargeGrid &&
                      cellSize >= 12 &&
                      getAntennaIcon(antennaType)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {isLargeGrid && (
        <div className="mt-2 text-xs text-slate-500 text-center">
          Large grid mode: Some visual effects disabled for performance
        </div>
      )}
    </div>
  );
}
