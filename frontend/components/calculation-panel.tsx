"use client";

import React, { useState } from "react";
import { Cpu, Play, RefreshCw, DollarSign, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { AntennaType, AntennaSpec } from "@/lib/api-config";

interface CalculationPanelProps {
  targetCoverage: number;
  setTargetCoverage: (v: number) => void;
  algorithm: "greedy" | "genetic" | "simulated-annealing" | "brute-force";
  setAlgorithm: (
    a: "greedy" | "genetic" | "simulated-annealing" | "brute-force"
  ) => void;
  antennaSpecs: AntennaSpec[];
  onOptimize: () => void;
  isOptimizing: boolean;
}

export function CalculationPanel({
  targetCoverage,
  setTargetCoverage,
  algorithm,
  setAlgorithm,
  antennaSpecs,
  onOptimize,
  isOptimizing,
}: CalculationPanelProps) {
  const [budgetLimit, setBudgetLimit] = useState<number | "">(100000);
  const [maxAntennas, setMaxAntennas] = useState<number | "">(50);
  const [useBudgetLimit, setUseBudgetLimit] = useState(false);
  const [useMaxAntennas, setUseMaxAntennas] = useState(false);
  const [allowedAntennaTypes, setAllowedAntennaTypes] = useState<
    Set<AntennaType>
  >(new Set(["Femto", "Pico", "Micro", "Macro"]));

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
    <div className="glass-panel p-4 rounded-xl w-full">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="text-purple-400" size={20} />
        <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Calculation & Optimization
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Target Coverage */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400 font-medium">
            Target User Coverage
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={targetCoverage}
              onChange={(e) => setTargetCoverage(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>50%</span>
              <span className="text-emerald-400 font-bold text-sm">
                {targetCoverage}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

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
                Budget Limit
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
          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                <span>Computing...</span>
              </>
            ) : (
              <>
                <Play fill="currentColor" size={18} />
                <span>Run Optimizer</span>
              </>
            )}
          </button>
          {(useBudgetLimit || useMaxAntennas) && (
            <div className="text-xs text-amber-400 mt-2">
              ⚠️ Constraints active
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
