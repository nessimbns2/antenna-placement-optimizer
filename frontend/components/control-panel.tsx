"use client";

import React from "react";
import {
  Settings2,
  Play,
  RefreshCw,
  Trash2,
  MapPin,
  Radio,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AntennaType, AntennaSpec } from "@/lib/api-config";

interface ControlPanelProps {
  rows: number;
  cols: number;
  setRows: (v: number) => void;
  setCols: (v: number) => void;
  targetCoverage: number;
  setTargetCoverage: (v: number) => void;
  antennaSpecs: AntennaSpec[];
  editMode: "house" | "antenna";
  setEditMode: (m: "house" | "antenna") => void;
  algorithm: "greedy" | "genetic" | "simulated-annealing" | "brute-force";
  setAlgorithm: (
    a: "greedy" | "genetic" | "simulated-annealing" | "brute-force"
  ) => void;
  onRandomize: () => void;
  onClear: () => void;
  onOptimize: () => void;
  isOptimizing: boolean;
}

export function ControlPanel({
  rows,
  cols,
  setRows,
  setCols,
  targetCoverage,
  setTargetCoverage,
  antennaSpecs,
  editMode,
  setEditMode,
  algorithm,
  setAlgorithm,
  onRandomize,
  onClear,
  onOptimize,
  isOptimizing,
}: ControlPanelProps) {
  const algorithmOptions = [
    {
      value: "greedy",
      label: "Greedy (Fast)",
      description: "Cost-optimized placement",
    },
    {
      value: "genetic",
      label: "Genetic Algorithm",
      description: "Evolutionary approach",
    },
    {
      value: "simulated-annealing",
      label: "Simulated Annealing",
      description: "Temperature-based",
    },
    {
      value: "brute-force",
      label: "Brute Force",
      description: "Exhaustive search",
    },
  ] as const;

  return (
    <div className="glass-panel p-6 rounded-xl w-full">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="text-blue-400" />
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Configuration
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-slate-500 block mb-1">Cols</span>
              <input
                type="number"
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-400 font-medium">
            Optimization Target
          </label>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-500 block mb-1">
                Target User Coverage (%)
              </span>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={targetCoverage}
                onChange={(e) => setTargetCoverage(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>50%</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {targetCoverage}%
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-slate-400 font-medium">
            Available Antenna Types
          </div>
          <div className="space-y-2">
            {antennaSpecs.map((spec) => (
              <div
                key={spec.type}
                className="p-2 bg-slate-900/50 rounded-lg border border-slate-800"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-200 uppercase">
                    {spec.type}
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    ${spec.cost.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <div>Coverage: {spec.radius} cells radius</div>
                  <div>Capacity: {spec.max_users} users</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm text-slate-400 font-medium flex items-center gap-2">
            <Cpu size={16} />
            Optimization Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as any)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all text-slate-300"
          >
            {algorithmOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} - {opt.description}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-slate-400 font-medium">Edit Mode</div>
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

        <div className="space-y-3">
          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOptimizing ? (
              <RefreshCw className="animate-spin" />
            ) : (
              <Play fill="currentColor" />
            )}
            Run Optimizer
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onRandomize}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Randomize
            </button>
            <button
              onClick={onClear}
              className="py-2 bg-slate-800 hover:bg-red-900/20 hover:text-red-400 text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
