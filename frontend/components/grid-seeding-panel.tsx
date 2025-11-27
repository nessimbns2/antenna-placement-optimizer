"use client";

import React from "react";
import { MapPin, Radio, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AntennaType } from "@/lib/api-config";

interface GridSeedingPanelProps {
  rows: number;
  cols: number;
  setRows: (v: number) => void;
  setCols: (v: number) => void;
  editMode: "house" | "antenna";
  setEditMode: (m: "house" | "antenna") => void;
  selectedAntennaType: AntennaType;
  setSelectedAntennaType: (t: AntennaType) => void;
  selectedPattern: string;
  setSelectedPattern: (p: string) => void;
  onClear: () => void;
}

export function GridSeedingPanel({
  rows,
  cols,
  setRows,
  setCols,
  editMode,
  setEditMode,
  selectedAntennaType,
  setSelectedAntennaType,
  selectedPattern,
  setSelectedPattern,
  onClear,
}: GridSeedingPanelProps) {
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
        {/* Grid Size */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400 font-medium">
            Grid Size
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-xs text-slate-500 block mb-1">Rows</span>
              <input
                type="number"
                value={rows}
                onChange={(e) => {
                  const val = Math.min(
                    1000,
                    Math.max(1, Number(e.target.value) || 1)
                  );
                  setRows(val);
                }}
                min="1"
                max="1000"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-slate-500 block mb-1">Cols</span>
              <input
                type="number"
                value={cols}
                onChange={(e) => {
                  const val = Math.min(
                    1000,
                    Math.max(1, Number(e.target.value) || 1)
                  );
                  setCols(val);
                }}
                min="1"
                max="1000"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
          {rows * cols > 10000 && (
            <div className="text-xs text-amber-400 mt-1">
              ⚡ Large grid: Using Canvas rendering
            </div>
          )}
          {rows * cols > 100000 && (
            <div className="text-xs text-orange-400 mt-1">
              ⚠️ Very large grid may be slow
            </div>
          )}
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
            <option value="Femto">Femto - $1k (r:1, 20 users)</option>
            <option value="Pico">Pico - $5k (r:6, 100 users)</option>
            <option value="Micro">Micro - $12k (r:40, 500 users)</option>
            <option value="Macro">Macro - $25k (r:100, 2000 users)</option>
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
        </div>
      </div>
    </div>
  );
}
