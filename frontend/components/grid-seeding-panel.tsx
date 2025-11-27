"use client";

import React from "react";
import { MapPin, Radio, Trash2, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { AntennaType } from "@/lib/api-config";

interface GridSeedingPanelProps {
  gridSize: number;
  setGridSize: (v: number) => void;
  editMode: "house" | "antenna";
  setEditMode: (m: "house" | "antenna") => void;
  selectedAntennaType: AntennaType;
  setSelectedAntennaType: (t: AntennaType) => void;
  selectedPattern: string;
  setSelectedPattern: (p: string) => void;
  onClear: () => void;
  forceCanvas: boolean;
  setForceCanvas: (v: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
  totalCells: number;
  onExport?: () => void;
  onImport?: (file: File) => void;
}

export function GridSeedingPanel({
  gridSize,
  setGridSize,
  editMode,
  setEditMode,
  selectedAntennaType,
  setSelectedAntennaType,
  selectedPattern,
  setSelectedPattern,
  onClear,
  forceCanvas,
  setForceCanvas,
  isFullscreen,
  setIsFullscreen,
  totalCells,
  onExport,
  onImport,
}: GridSeedingPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const patterns = [
    { value: "random", label: "🎲 Random Pattern" },
    { value: "circular_clusters", label: "🔵 Circular Clusters" },
    { value: "isolated_houses", label: "🏠 Isolated Houses" },
    { value: "urban_grid", label: "🏙️ Urban Grid" },
    { value: "suburban_spread", label: "🏡 Suburban Spread" },
    { value: "linear_streets", label: "🛣️ Linear Streets" },
    { value: "random_scattered", label: "✨ Random Scattered" },
    { value: "dense_downtown", label: "🌆 Dense Downtown" },
    { value: "donut_ring", label: "🍩 Donut Ring" },
    { value: "diagonal_lines", label: "⚡ Diagonal Lines" },
    { value: "coastal_settlement", label: "🏖️ Coastal Settlement" },
    { value: "mountain_valley", label: "⛰️ Mountain Valley" },
    { value: "checkerboard", label: "♟️ Checkerboard" },
    { value: "riverside_towns", label: "🌊 Riverside Towns" },
    { value: "highway_network", label: "🛤️ Highway Network" },
  ];
  return (
    <div className="glass-panel p-4 rounded-xl w-full">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="text-emerald-400" size={20} />
        <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Grid Seeding
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Grid Size - 1:1 Ratio */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400 font-medium">
            Grid Size (1:1)
          </label>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500">Size</span>
                <span className="text-sm text-emerald-400 font-bold">
                  {gridSize}×{gridSize}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="350"
                step="10"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>10×10</span>
                <span>350×350</span>
              </div>
            </div>
            <button
              onClick={() => setGridSize(20)}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
            >
              Reset to 20×20
            </button>
          </div>

          {/* View Options */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Force Canvas</span>
              <button
                onClick={() => setForceCanvas(!forceCanvas)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-all",
                  forceCanvas
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {forceCanvas ? "ON" : "OFF"}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Fullscreen</span>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-all",
                  isFullscreen
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {isFullscreen ? "ON" : "OFF"}
              </button>
            </div>
            {totalCells < 100 && forceCanvas && (
              <div className="text-xs text-emerald-400 mt-1">
                ✓ Using large pixels for small grid
              </div>
            )}
          </div>
        </div>

        {/* Pattern Selection */}
        <div className="space-y-2">
          <div className="text-sm text-slate-400 font-medium">
            House Pattern
          </div>
          <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-300"
          >
            {patterns.map((pattern) => (
              <option key={pattern.value} value={pattern.value}>
                {pattern.label}
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-500">
            {selectedPattern === "random"
              ? "Random weighted selection"
              : "Generate specific pattern"}
          </div>
        </div>

        {/* Edit Mode */}
        <div className="space-y-2">
          <div className="text-sm text-slate-400 font-medium">Paint Mode</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setEditMode("house")}
              className={cn(
                "flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                editMode === "house"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/50"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-transparent"
              )}
            >
              <MapPin size={16} /> Houses
            </button>
            <button
              onClick={() => setEditMode("antenna")}
              className={cn(
                "flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                editMode === "antenna"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-transparent"
              )}
            >
              <Radio size={16} /> Antennas
            </button>
          </div>
        </div>

        {/* Antenna Type Selection */}
        <div className="space-y-2">
          <div className="text-sm text-slate-400 font-medium">
            Antenna Type (for painting)
          </div>
          <select
            value={selectedAntennaType}
            onChange={(e) =>
              setSelectedAntennaType(e.target.value as AntennaType)
            }
            disabled={editMode !== "antenna"}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="Femto">Femto - $200 (r:2, 20 users)</option>
            <option value="Pico">Pico - $2.1k (r:5, 300 users)</option>
            <option value="Micro">Micro - $6k (r:15, 1200 users)</option>
            <option value="Macro">Macro - $30k (r:40, 4000 users)</option>
          </select>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="text-sm text-slate-400 font-medium">Actions</div>
          <button
            onClick={onClear}
            className="w-full py-2 bg-slate-800 hover:bg-red-900/20 hover:text-red-400 text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={14} /> Clear
          </button>
          {onExport && (
            <button
              onClick={onExport}
              className="w-full py-2 bg-slate-800 hover:bg-emerald-900/20 hover:text-emerald-400 text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Download size={14} /> Export
            </button>
          )}
          {onImport && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleImportClick}
                className="w-full py-2 bg-slate-800 hover:bg-blue-900/20 hover:text-blue-400 text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <Upload size={14} /> Import
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
