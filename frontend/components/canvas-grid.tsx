"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import { AntennaType, AntennaPlacement } from "@/lib/api-config";

export type CellType = "empty" | "house" | "antenna" | "covered";

interface CanvasGridProps {
  rows: number;
  cols: number;
  grid: CellType[][];
  onCellClick: (row: number, col: number) => void;
  coverage: boolean[][];
  antennaData?: AntennaPlacement[];
  manualAntennas?: Map<string, AntennaType>;
  antennaSpecs?: {
    type: AntennaType;
    radius: number;
    max_users: number;
    cost: number;
  }[];
}

export function CanvasGrid({
  rows,
  cols,
  grid,
  onCellClick,
  coverage,
  antennaData = [],
  manualAntennas = new Map(),
  antennaSpecs = [],
}: CanvasGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  // Adaptive cell size
  const cellSize = Math.max(
    4,
    Math.min(40, Math.floor(800 / Math.max(rows, cols)))
  );
  const canvasWidth = cols * cellSize;
  const canvasHeight = rows * cellSize;

  // Color palettes - memoized to prevent re-renders
  const colors = useMemo(
    () => ({
      empty: "#0f172a",
      emptyHover: "#1e293b",
      houseCovered: "#059669",
      houseUncovered: "#dc2626",
      antenna: {
        Femto: "#06b6d4",
        Pico: "#3b82f6",
        Micro: "#a855f7",
        Macro: "#ec4899",
      },
      coverage: "rgba(255, 255, 255, 0.1)",
      border: "#1e293b",
    }),
    []
  );

  // Get antenna type for a cell
  const getAntennaType = useCallback(
    (r: number, c: number): AntennaType | undefined => {
      const optimized = antennaData.find((ant) => ant.y === r && ant.x === c);
      if (optimized) return optimized.type;
      const key = `${r},${c}`;
      return manualAntennas.get(key);
    },
    [antennaData, manualAntennas]
  );

  // Draw the grid
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellSize;
        const y = r * cellSize;
        const cell = grid[r]?.[c];
        const isCovered = coverage[r]?.[c];
        const isHovered = hoveredCell?.row === r && hoveredCell?.col === c;

        // Background color
        let bgColor = colors.empty;

        if (cell === "house") {
          bgColor = isCovered ? colors.houseCovered : colors.houseUncovered;
        } else if (cell === "antenna") {
          const antennaType = getAntennaType(r, c);
          if (antennaType) {
            bgColor = colors.antenna[antennaType];
          }
        } else if (isHovered) {
          bgColor = colors.emptyHover;
        }

        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, cellSize, cellSize);

        // Draw coverage overlay for empty cells
        if (cell === "empty" && isCovered) {
          ctx.fillStyle = colors.coverage;
          ctx.fillRect(x, y, cellSize, cellSize);
        }

        // Draw border
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        // Draw simple indicators for houses and antennas when cells are large enough
        if (cellSize >= 8) {
          ctx.fillStyle = "#ffffff";
          ctx.font = `${Math.floor(cellSize * 0.6)}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (cell === "house") {
            ctx.fillText("H", x + cellSize / 2, y + cellSize / 2);
          } else if (cell === "antenna") {
            ctx.fillText("A", x + cellSize / 2, y + cellSize / 2);
          }
        }
      }
    }

    // Draw antenna coverage circles (only for grids < 300x300)
    if (rows * cols < 90000 && cellSize >= 8) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      // Draw from antennaData
      for (const antenna of antennaData) {
        const centerX = (antenna.x + 0.5) * cellSize;
        const centerY = (antenna.y + 0.5) * cellSize;
        const radius = antenna.radius * cellSize;

        ctx.strokeStyle = colors.antenna[antenna.type] + "80"; // Add alpha
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw from manual antennas
      manualAntennas.forEach((type, key) => {
        const [r, c] = key.split(",").map(Number);
        const spec = antennaSpecs.find((s) => s.type === type);
        if (spec) {
          const centerX = (c + 0.5) * cellSize;
          const centerY = (r + 0.5) * cellSize;
          const radius = spec.radius * cellSize;

          ctx.strokeStyle = colors.antenna[type] + "80"; // Add alpha
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      ctx.setLineDash([]);
    }
  }, [
    rows,
    cols,
    grid,
    coverage,
    cellSize,
    canvasWidth,
    canvasHeight,
    hoveredCell,
    antennaData,
    manualAntennas,
    antennaSpecs,
    getAntennaType,
    colors,
  ]);

  // Redraw on changes
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  // Handle mouse click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        onCellClick(row, col);
      }
    },
    [cellSize, rows, cols, onCellClick]
  );

  // Handle mouse move for hover effect
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        setHoveredCell({ row, col });
      } else {
        setHoveredCell(null);
      }
    },
    [cellSize, rows, cols]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  return (
    <div className="relative glass-panel rounded-xl p-4">
      <div className="overflow-auto max-h-[800px] max-w-full">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-pointer"
          style={{
            imageRendering: cellSize < 10 ? "pixelated" : "auto",
          }}
        />
      </div>
      <div className="mt-2 text-xs text-slate-400 text-center">
        Canvas-based grid • {rows}×{cols} = {rows * cols} cells • Cell size:{" "}
        {cellSize}px
      </div>
    </div>
  );
}
