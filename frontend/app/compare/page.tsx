"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Play, Settings2 } from "lucide-react";
import { API_CONFIG, AntennaType, OptimizationResponse } from "@/lib/api-config";

export default function ComparePage() {
  const [gridSize, setGridSize] = useState(20);
  const [allowedAntennaTypes, setAllowedAntennaTypes] = useState<Set<AntennaType>>(
    new Set(["Femto", "Pico", "Micro", "Macro"])
  );
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<OptimizationResponse[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [obstacles, setObstacles] = useState<[number, number][]>([]);

  const algorithms = ["greedy", "genetic", "simulated-annealing", "tabu-search", "hill-climbing", "vns"];
  const algorithmLabels: Record<string, string> = {
    greedy: "Greedy",
    genetic: "Genetic",
    "simulated-annealing": "Simulated Annealing",
    "tabu-search": "Tabu Search",
    "hill-climbing": "Hill Climbing",
    vns: "VNS",
  };

  const toggleAntennaType = (type: AntennaType) => {
    const newSet = new Set(allowedAntennaTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setAllowedAntennaTypes(newSet);
  };

  const generateRandomObstacles = (size: number): [number, number][] => {
    const obstacles: [number, number][] = [];
    const density = 0.15; // 15% density
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (Math.random() < density) {
          obstacles.push([x, y]);
        }
      }
    }
    return obstacles;
  };

  const runComparison = async () => {
    if (allowedAntennaTypes.size === 0) {
      alert("Please select at least one antenna type.");
      return;
    }

    setIsRunning(true);
    setResults([]);
    setErrors([]);

    try {
      // Generate a single set of obstacles for fair comparison
      const newObstacles = generateRandomObstacles(gridSize);
      setObstacles(newObstacles);

      const promises = algorithms.map(async (algo) => {
        try {
          const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OPTIMIZE}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                width: gridSize,
                height: gridSize,
                obstacles: newObstacles,
                algorithm: algo,
                allowed_antenna_types: Array.from(allowedAntennaTypes),
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to run ${algo}`);
          }

          return await response.json();
        } catch (err) {
          console.error(err);
          return null;
        }
      });

      const data = await Promise.all(promises);
      const validResults = data.filter((r): r is OptimizationResponse => r !== null);
      setResults(validResults);

      if (validResults.length < algorithms.length) {
        setErrors(["Some algorithms failed to complete."]);
      }
    } catch (error) {
      console.error("Comparison failed", error);
      setErrors(["An unexpected error occurred during comparison."]);
    } finally {
      setIsRunning(false);
    }
  };

  // Helper to find max value for scaling charts
  const getMaxValue = (field: keyof OptimizationResponse) => {
    return Math.max(...results.map((r) => Number(r[field]) || 0), 1);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Algorithm Comparison
            </h1>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-neutral-400">
            <Settings2 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Configuration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-neutral-300">
                Grid Size ({gridSize}x{gridSize})
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-neutral-500">
                <span>10x10</span>
                <span>100x100</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-neutral-300">
                Antenna Types
              </label>
              <div className="flex flex-wrap gap-3">
                {(["Femto", "Pico", "Micro", "Macro"] as AntennaType[]).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => toggleAntennaType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${allowedAntennaTypes.has(type)
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                        }`}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={runComparison}
              disabled={isRunning}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${isRunning
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/20"
                }`}
            >
              {isRunning ? (
                <>Running...</>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Comparison
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 text-neutral-400">
              <BarChart3 className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Results Analysis</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coverage Chart */}
              <VerticalBarChart
                title="Coverage"
                data={results}
                field="coverage_percentage"
                color="from-emerald-500 to-emerald-600"
                suffix="%"
              />

              {/* Cost Chart */}
              <VerticalBarChart
                title="Total Cost"
                data={results}
                field="total_cost"
                color="from-amber-500 to-amber-600"
                prefix="$"
              />

              {/* Execution Time Chart */}
              <VerticalBarChart
                title="Execution Time"
                data={results}
                field="execution_time_ms"
                color="from-blue-500 to-blue-600"
                suffix="ms"
              />
            </div>

            {/* Grid Visualizations */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-neutral-300 mb-4">
                Antenna Placements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((result) => (
                  <ComparisonGrid
                    key={result.algorithm}
                    result={result}
                    gridSize={gridSize}
                    obstacles={obstacles}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Grid visualization component
function ComparisonGrid({
  result,
  gridSize,
  obstacles,
}: {
  result: OptimizationResponse;
  gridSize: number;
  obstacles: [number, number][];
}) {
  const cellSize = Math.max(4, Math.min(12, 240 / gridSize));

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-neutral-300 capitalize">
          {result.algorithm.replace("-", " ")}
        </h4>
        <div className="text-xs text-neutral-500 mt-1">
          {result.antennas.length} antennas • ${result.total_cost.toLocaleString()}
        </div>
      </div>
      <div
        className="relative bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800"
        style={{
          width: `${cellSize * gridSize}px`,
          height: `${cellSize * gridSize}px`,
        }}
      >
        {/* Houses */}
        {obstacles.map(([x, y], idx) => (
          <div
            key={`house-${idx}`}
            className="absolute bg-amber-500/40 border border-amber-600/60"
            style={{
              left: `${x * cellSize}px`,
              top: `${y * cellSize}px`,
              width: `${cellSize}px`,
              height: `${cellSize}px`,
            }}
          />
        ))}
        {/* Antennas */}
        {result.antennas.map((antenna, idx) => (
          <div
            key={`antenna-${idx}`}
            className="absolute rounded-full bg-cyan-500/60 border-2 border-cyan-400"
            style={{
              left: `${antenna.x * cellSize}px`,
              top: `${antenna.y * cellSize}px`,
              width: `${cellSize}px`,
              height: `${cellSize}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function VerticalBarChart({
  title,
  data,
  field,
  color,
  prefix = "",
  suffix = "",
}: {
  title: string;
  data: OptimizationResponse[];
  field: keyof OptimizationResponse;
  color: string;
  prefix?: string;
  suffix?: string;
}) {
  const maxValue = Math.max(...data.map((r) => Number(r[field]) || 0), 1);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col h-80">
      <h3 className="text-sm font-medium text-neutral-400 mb-6">{title}</h3>
      <div className="flex-1 flex items-end justify-between gap-4">
        {data.map((result) => {
          const value = Number(result[field]) || 0;
          const percentage = Math.max((value / maxValue) * 100, 4); // Min 4% height for visibility

          return (
            <div key={result.algorithm} className="flex-1 flex flex-col items-center gap-3 group">
              <div className="relative w-full flex justify-center items-end flex-1">
                <div
                  className={`w-full max-w-[60px] rounded-t-lg bg-gradient-to-t ${color} opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out relative`}
                  style={{ height: `${percentage}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-neutral-700 pointer-events-none z-10">
                    {prefix}
                    {value.toLocaleString()}
                    {suffix}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-neutral-300 capitalize truncate max-w-[80px]" title={result.algorithm.replace("-", " ")}>
                  {result.algorithm.replace("-", " ")}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  {prefix}
                  {Number(value).toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                    notation: value > 10000 ? "compact" : "standard",
                  })}
                  {suffix}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
