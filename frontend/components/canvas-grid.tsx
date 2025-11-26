"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import { Maximize2, ZoomIn, ZoomOut, Minimize2 } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panMode, setPanMode] = useState(false);

  // Base cell size
  const baseCellSize = Math.max(
    4,
    Math.min(40, Math.floor(800 / Math.max(rows, cols)))
  );

  // Actual cell size with zoom
  const cellSize = baseCellSize * zoom;
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

  // Draw the grid with viewport culling
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Get visible viewport bounds
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    // Calculate which cells are visible (with buffer)
    const startCol = Math.max(0, Math.floor(scrollLeft / cellSize) - 1);
    const endCol = Math.min(
      cols,
      Math.ceil((scrollLeft + viewportWidth) / cellSize) + 1
    );
    const startRow = Math.max(0, Math.floor(scrollTop / cellSize) - 1);
    const endRow = Math.min(
      rows,
      Math.ceil((scrollTop + viewportHeight) / cellSize) + 1
    );

    // Clear canvas
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Only draw visible cells
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
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

        // Draw border (only if zoomed in enough)
        if (cellSize >= 4) {
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }

        // Draw indicators when cells are large enough
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

    // Draw antenna coverage circles at all zoom levels
    const showCoverageCircles = true;
    if (showCoverageCircles) {
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);

      // Draw from antennaData (only visible ones)
      for (const antenna of antennaData) {
        if (
          antenna.x >= startCol - antenna.radius &&
          antenna.x <= endCol + antenna.radius &&
          antenna.y >= startRow - antenna.radius &&
          antenna.y <= endRow + antenna.radius
        ) {
          const centerX = (antenna.x + 0.5) * cellSize;
          const centerY = (antenna.y + 0.5) * cellSize;
          const radius = antenna.radius * cellSize;

          // Fill with white, nearly transparent
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Stroke with white dashed outline
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw from manual antennas
      for (const [key, type] of manualAntennas) {
        const [r, c] = key.split(",").map(Number);
        const spec = antennaSpecs.find((s) => s.type === type);
        if (
          spec &&
          c >= startCol - spec.radius &&
          c <= endCol + spec.radius &&
          r >= startRow - spec.radius &&
          r <= endRow + spec.radius
        ) {
          const centerX = (c + 0.5) * cellSize;
          const centerY = (r + 0.5) * cellSize;
          const radius = spec.radius * cellSize;

          // Fill with white, nearly transparent
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Stroke with white dashed outline
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

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

  // Redraw on changes and scroll
  useEffect(() => {
    drawGrid();

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => drawGrid();
    container.addEventListener("scroll", handleScroll);

    return () => container.removeEventListener("scroll", handleScroll);
  }, [drawGrid]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.5, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.5, 0.1));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const togglePanMode = useCallback(() => {
    setPanMode((prev) => !prev);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Fullscreen error:", err);
        });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Handle mouse click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging || panMode) return; // Block clicking in pan mode

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
    [cellSize, rows, cols, onCellClick, isDragging, panMode]
  ); // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        // Middle click or Shift+Click
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        e.preventDefault();
      }
    },
    [pan]
  );

  const handleMouseMoveCanvas = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }

      // Hover effect
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
    [cellSize, rows, cols, isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.1, Math.min(10, prev * delta)));
    }
  }, []);

  return (
    <div className="relative glass-panel rounded-xl p-4" ref={containerRef}>
      {/* Control buttons */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all shadow-lg backdrop-blur-sm"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 size={18} className="text-slate-300" />
          ) : (
            <Maximize2 size={18} className="text-slate-300" />
          )}
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all shadow-lg backdrop-blur-sm"
          title="Zoom In"
        >
          <ZoomIn size={18} className="text-slate-300" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all shadow-lg backdrop-blur-sm"
          title="Zoom Out"
        >
          <ZoomOut size={18} className="text-slate-300" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all shadow-lg backdrop-blur-sm text-xs font-mono text-slate-300"
          title="Reset Zoom"
        >
          1:1
        </button>
        <button
          onClick={togglePanMode}
          className={`p-2 border border-slate-700 rounded-lg transition-all shadow-lg backdrop-blur-sm ${
            panMode
              ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
              : "bg-slate-900/90 hover:bg-slate-800"
          }`}
          title={
            panMode
              ? "Pan Mode ON (Click to disable)"
              : "Pan Mode OFF (Click to enable)"
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-300"
          >
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
        </button>
      </div>

      <div
        className={`overflow-auto ${isFullscreen ? "h-screen w-screen" : "max-h-[800px] max-w-full"}`}
        style={{
          cursor: isDragging ? "grabbing" : panMode ? "grab" : "default",
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className="cursor-pointer"
          style={{
            imageRendering: cellSize < 10 ? "pixelated" : "auto",
          }}
        />
      </div>
      <div className="mt-2 text-xs text-slate-400 text-center">
        Canvas • {rows}×{cols} = {rows * cols} cells • Zoom: {zoom.toFixed(1)}x
        • Cell: {cellSize.toFixed(1)}px • Coverage circles ON
        {panMode && " • 🖐️ PAN MODE"}
      </div>
    </div>
  );
}
