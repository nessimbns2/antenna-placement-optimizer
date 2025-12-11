"use client";

import React, { useState } from "react";
import { Cpu, Play, RefreshCw, DollarSign, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { AntennaType, AntennaSpec } from "@/lib/api-config";

interface CalculationPanelProps {
  algorithm: "greedy" | "genetic" | "simulated-annealing" | "brute-force";
  setAlgorithm: (
    a: "greedy" | "genetic" | "simulated-annealing" | "brute-force"
  ) => void;
  antennaSpecs: AntennaSpec[];
  allowedAntennaTypes: Set<AntennaType>;
  setAllowedAntennaTypes: (types: Set<AntennaType>) => void;
  onOptimize: (params: { maxBudget?: number; maxAntennas?: number }) => void;
  isOptimizing: boolean;
  // Streaming visualization props
  streamingMode?: boolean;
  setStreamingMode?: (mode: boolean) => void;
  streamProgress?: number;
  streamStats?: {
    iteration: number;
    temperature: number;
    energy: number;
    acceptanceRate: number;
  } | null;
}

export function CalculationPanel({
  algorithm,
  setAlgorithm,
  antennaSpecs,
  allowedAntennaTypes,
  setAllowedAntennaTypes,
  onOptimize,
  isOptimizing,
  streamingMode = false,
  setStreamingMode,
  streamProgress = 0,
  streamStats = null,
}: CalculationPanelProps) {
  const [budgetLimit, setBudgetLimit] = useState<number | "">(100000);
  const [maxAntennas, setMaxAntennas] = useState<number | "">(50);
  const [useBudgetLimit, setUseBudgetLimit] = useState(false);
  const [useMaxAntennas, setUseMaxAntennas] = useState(false);

  const toggleAntennaType = (type: AntennaType) => {
    const newSet = new Set(allowedAntennaTypes);
    if (newSet.has(type)) {
      if (newSet.size > 1) {
        // Keep at least one antenna type selected
        newSet.delete(type);
      }
    } else {
      newSet.add(type);
    }
    setAllowedAntennaTypes(newSet);
  };

  const handleOptimize = () => {
    onOptimize({
      maxBudget:
        useBudgetLimit && budgetLimit ? Number(budgetLimit) : undefined,
      maxAntennas:
        useMaxAntennas && maxAntennas ? Number(maxAntennas) : undefined,
    });
  };

  const algorithmOptions = [
    {
      value: "greedy",
      label: "Greedy (Fast)",
      description: "Score-based placement (users covered / cost)",
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
    <div className="glass-panel p-4 rounded-xl w-full">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="text-purple-400" size={20} />
        <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Calculation & Optimization
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Constraints */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400 font-medium">
            Constraints
          </label>
          <div className="space-y-2">
            {/* Budget Limit */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="budget-limit"
                checked={useBudgetLimit}
                onChange={(e) => setUseBudgetLimit(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="budget-limit"
                className="text-xs text-slate-400 cursor-pointer flex-1"
              >
                Max Budget
              </label>
            </div>
            {useBudgetLimit && (
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-slate-500" />
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) =>
                    setBudgetLimit(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  min="1000"
                  step="1000"
                  placeholder="100000"
                  className="flex-1 bg-slate-950/50 border border-slate-800 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}

            {/* Max Antennas */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="max-antennas"
                checked={useMaxAntennas}
                onChange={(e) => setUseMaxAntennas(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="max-antennas"
                className="text-xs text-slate-400 cursor-pointer flex-1"
              >
                Max Antennas
              </label>
            </div>
            {useMaxAntennas && (
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-slate-500" />
                <input
                  type="number"
                  value={maxAntennas}
                  onChange={(e) =>
                    setMaxAntennas(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  min="1"
                  step="1"
                  placeholder="50"
                  className="flex-1 bg-slate-950/50 border border-slate-800 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            )}
            {(useBudgetLimit || useMaxAntennas) && (
              <div className="text-xs text-emerald-400 mt-1">
                ✓ Optimization: Max coverage with constraints
              </div>
            )}
            {!useBudgetLimit && !useMaxAntennas && (
              <div className="text-xs text-purple-400 mt-1">
                ⚠️ No constraints: May place many antennas
              </div>
            )}
          </div>
        </div>

        {/* Allowed Antenna Types */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400 font-medium">
            Allowed Antenna Types
          </label>
          <div className="space-y-1.5">
            {antennaSpecs.map((spec) => (
              <div key={spec.type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`antenna-${spec.type}`}
                  checked={allowedAntennaTypes.has(spec.type)}
                  onChange={() => toggleAntennaType(spec.type)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
                <label
                  htmlFor={`antenna-${spec.type}`}
                  className={cn(
                    "text-xs cursor-pointer flex-1",
                    allowedAntennaTypes.has(spec.type)
                      ? "text-slate-300"
                      : "text-slate-600"
                  )}
                >
                  {spec.type} - ${spec.cost / 1000}k
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithm Selection */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400 font-medium flex items-center gap-2">
            <Cpu size={14} />
            Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) =>
              setAlgorithm(
                e.target.value as
                | "greedy"
                | "genetic"
                | "simulated-annealing"
                | "brute-force"
              )
            }
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all text-slate-300"
          >
            {algorithmOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-500 mt-1">
            {
              algorithmOptions.find((opt) => opt.value === algorithm)
                ?.description
            }
          </div>
        </div>

        {/* Run Button */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400 font-medium">Execute</label>

          {/* Streaming Mode Toggle - only show for simulated annealing */}
          {algorithm === "simulated-annealing" && setStreamingMode && (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="streaming-mode"
                checked={streamingMode}
                onChange={(e) => setStreamingMode(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
              <label
                htmlFor="streaming-mode"
                className="text-xs text-cyan-400 cursor-pointer"
              >
                🎬 Watch algorithm in real-time
              </label>
            </div>
          )}

          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                <span>{streamingMode && algorithm === "simulated-annealing" ? "Visualizing..." : "Computing..."}</span>
              </>
            ) : (
              <>
                <Play fill="currentColor" size={18} />
                <span>{streamingMode && algorithm === "simulated-annealing" ? "Watch Optimization" : "Run Optimizer"}</span>
              </>
            )}
          </button>

          {/* Progress Bar - show when streaming */}
          {isOptimizing && streamingMode && algorithm === "simulated-annealing" && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{streamProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
                  style={{ width: `${streamProgress}%` }}
                />
              </div>

              {/* Real-time Stats */}
              {streamStats && (
                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                  <div className="bg-slate-800/50 rounded px-2 py-1">
                    <span className="text-slate-500">🔄 Iteration:</span>
                    <span className="text-cyan-400 ml-1">{streamStats.iteration.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-800/50 rounded px-2 py-1">
                    <span className="text-slate-500">🌡️ Temp:</span>
                    <span className="text-orange-400 ml-1">{streamStats.temperature.toFixed(1)}</span>
                  </div>
                  <div className="bg-slate-800/50 rounded px-2 py-1">
                    <span className="text-slate-500">⚡ Energy:</span>
                    <span className="text-yellow-400 ml-1">{streamStats.energy.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-800/50 rounded px-2 py-1">
                    <span className="text-slate-500">✓ Accept:</span>
                    <span className="text-green-400 ml-1">{streamStats.acceptanceRate.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs mt-2 space-y-1">
            {!useBudgetLimit && !useMaxAntennas && (
              <div className="text-purple-400">🎯 Goal: Cover all users</div>
            )}
            {(useBudgetLimit || useMaxAntennas) && (
              <div className="text-emerald-400">
                🎯 Goal: Maximum coverage
                {useBudgetLimit && budgetLimit && (
                  <span className="block">
                    💰 Budget: ${budgetLimit.toLocaleString()}
                  </span>
                )}
                {useMaxAntennas && maxAntennas && (
                  <span className="block">📡 Max antennas: {maxAntennas}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
