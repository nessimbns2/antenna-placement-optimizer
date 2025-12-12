"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Play,
  Settings2,
  Plus,
  Download,
  X,
  FlaskConical,
} from "lucide-react";
import {
  API_CONFIG,
  AntennaType,
  OptimizationResponse,
} from "@/lib/api-config";
import { PATTERNS, generateObstacles } from "@/lib/pattern-generators";

// Types
interface Scenario {
  id: string;
  gridSize: number;
  pattern: string;
  maxBudget: number | null;
  maxAntennas: number | null;
  allowedAntennaTypes: AntennaType[];
}

interface ScenarioResult {
  scenario: Scenario;
  results: OptimizationResponse[];
  obstacles: [number, number][];
}

const algorithms = [
  "greedy",
  "genetic",
  "simulated-annealing",
  "tabu-search",
  "hill-climbing",
  "vns",
];

const algorithmLabels: Record<string, string> = {
  greedy: "Greedy",
  genetic: "Genetic",
  "simulated-annealing": "Sim. Anneal",
  "tabu-search": "Tabu",
  "hill-climbing": "Hill Climb",
  vns: "VNS",
};

export default function ComparePage() {
  // Configuration state
  const [gridSize, setGridSize] = useState(20);
  const [selectedPattern, setSelectedPattern] = useState("random_scattered");
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [maxAntennas, setMaxAntennas] = useState<number | null>(null);
  const [allowedAntennaTypes, setAllowedAntennaTypes] = useState<
    Set<AntennaType>
  >(new Set(["Femto", "Pico", "Micro", "Macro"]));

  // Scenario queue
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  // Results state
  const [isRunning, setIsRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);
  const [currentSingleResult, setCurrentSingleResult] = useState<{
    results: OptimizationResponse[];
    obstacles: [number, number][];
    scenario: Scenario | null;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [importedResultsPreview, setImportedResultsPreview] = useState<
    object | null
  >(null);

  const toggleAntennaType = (type: AntennaType) => {
    const newSet = new Set(allowedAntennaTypes);
    if (newSet.has(type)) {
      if (newSet.size > 1) newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setAllowedAntennaTypes(newSet);
  };

  const addScenario = () => {
    const newScenario: Scenario = {
      id: crypto.randomUUID(),
      gridSize,
      pattern: selectedPattern,
      maxBudget,
      maxAntennas,
      allowedAntennaTypes: Array.from(allowedAntennaTypes),
    };
    setScenarios([...scenarios, newScenario]);
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter((s) => s.id !== id));
  };

  const clearScenarios = () => {
    setScenarios([]);
  };

  // File input ref for import
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.scenarios && Array.isArray(data.scenarios)) {
          const importedScenarios: Scenario[] = data.scenarios.map(
            (s: {
              gridSize?: number;
              pattern?: string;
              maxBudget?: number | null;
              maxAntennas?: number | null;
              allowedAntennaTypes?: AntennaType[];
            }) => ({
              id: crypto.randomUUID(),
              gridSize: s.gridSize || 50,
              pattern: s.pattern || "random_scattered",
              maxBudget: s.maxBudget || null,
              maxAntennas: s.maxAntennas || null,
              allowedAntennaTypes:
                s.allowedAntennaTypes || Array.from(allowedAntennaTypes),
            })
          );
          setScenarios([...scenarios, ...importedScenarios]);
          alert(`Imported ${importedScenarios.length} scenarios!`);
        } else {
          alert("Invalid file format. Expected { scenarios: [...] }");
        }
      } catch (err) {
        alert("Failed to parse file. Make sure it's valid JSON.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset for re-import
  };

  // Import saved results
  const resultsInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportResultsClick = () => {
    resultsInputRef.current?.click();
  };

  const handleImportResults = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        // Check if it has full scenario data for display
        if (data.fullScenarios && Array.isArray(data.fullScenarios)) {
          // Convert to ScenarioResult format
          const imported: ScenarioResult[] = data.fullScenarios.map(
            (fs: {
              scenario: {
                id: string;
                gridSize: number;
                pattern: string;
                maxBudget: number | null;
                maxAntennas: number | null;
                allowedAntennaTypes?: AntennaType[];
              };
              obstacles: [number, number][];
              results: OptimizationResponse[];
            }) => ({
              scenario: {
                id: fs.scenario.id || crypto.randomUUID(),
                gridSize: fs.scenario.gridSize,
                pattern: fs.scenario.pattern,
                maxBudget: fs.scenario.maxBudget,
                maxAntennas: fs.scenario.maxAntennas,
                allowedAntennaTypes: fs.scenario.allowedAntennaTypes || [
                  "Femto",
                  "Pico",
                  "Micro",
                  "Macro",
                ],
              },
              obstacles: fs.obstacles,
              results: fs.results,
            })
          );
          setScenarioResults(imported);
          alert(`Loaded ${imported.length} scenarios with full results!`);
        } else {
          // Just show preview for old format
          setImportedResultsPreview(data);
          alert(`Loaded results preview from ${file.name}`);
        }
      } catch (err) {
        alert("Failed to parse results file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const runSingleComparison = async () => {
    if (allowedAntennaTypes.size === 0) {
      alert("Please select at least one antenna type.");
      return;
    }

    setIsRunning(true);
    setCurrentSingleResult(null);

    try {
      const obstacles = generateObstacles(selectedPattern, gridSize);
      const results = await runAlgorithmsOnScenario(
        {
          id: "single",
          gridSize,
          pattern: selectedPattern,
          maxBudget,
          maxAntennas,
          allowedAntennaTypes: Array.from(allowedAntennaTypes),
        },
        obstacles
      );

      setCurrentSingleResult({
        results,
        obstacles,
        scenario: {
          id: "single",
          gridSize,
          pattern: selectedPattern,
          maxBudget,
          maxAntennas,
          allowedAntennaTypes: Array.from(allowedAntennaTypes),
        },
      });
    } catch (error) {
      console.error("Comparison failed", error);
      alert("Comparison failed. Check console for details.");
    } finally {
      setIsRunning(false);
    }
  };

  const runBatchScenarios = async () => {
    if (scenarios.length === 0) {
      alert("Please add at least one scenario to the queue.");
      return;
    }

    setIsRunning(true);
    setScenarioResults([]);
    setBatchProgress({ current: 0, total: scenarios.length });

    const allResults: ScenarioResult[] = [];

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      setBatchProgress({ current: i + 1, total: scenarios.length });

      try {
        const obstacles = generateObstacles(
          scenario.pattern,
          scenario.gridSize
        );
        const results = await runAlgorithmsOnScenario(scenario, obstacles);
        allResults.push({ scenario, results, obstacles });
      } catch (error) {
        console.error(`Scenario ${i + 1} failed`, error);
      }
    }

    setScenarioResults(allResults);
    setIsRunning(false);

    // Auto export
    if (allResults.length > 0) {
      exportBatchResults(allResults);
    }
  };

  const runAlgorithmsOnScenario = async (
    scenario: Scenario,
    obstacles: [number, number][]
  ): Promise<OptimizationResponse[]> => {
    const promises = algorithms.map(async (algo) => {
      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OPTIMIZE}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              width: scenario.gridSize,
              height: scenario.gridSize,
              obstacles,
              algorithm: algo,
              allowed_antenna_types: scenario.allowedAntennaTypes,
              max_budget: scenario.maxBudget,
              max_antennas: scenario.maxAntennas,
            }),
          }
        );
        if (!response.ok) throw new Error(`Failed: ${algo}`);
        return await response.json();
      } catch (err) {
        console.error(err);
        return null;
      }
    });

    const data = await Promise.all(promises);
    return data.filter((r): r is OptimizationResponse => r !== null);
  };

  const exportBatchResults = (results: ScenarioResult[]) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // Export JSON with FULL data for re-import
    const jsonData = {
      generated: new Date().toISOString(),
      antennaTypes: Array.from(allowedAntennaTypes),
      // Full data for re-import and display
      fullScenarios: results.map((sr) => ({
        scenario: sr.scenario,
        obstacles: sr.obstacles,
        results: sr.results,
      })),
      // Summary for quick preview
      summary: results.map((sr, idx) => ({
        id: idx + 1,
        gridSize: sr.scenario.gridSize,
        pattern: sr.scenario.pattern,
        maxBudget: sr.scenario.maxBudget,
        maxAntennas: sr.scenario.maxAntennas,
        houses: sr.obstacles.length,
        results: sr.results.map((r) => ({
          algorithm: r.algorithm,
          coverage: r.coverage_percentage,
          cost: r.total_cost,
          antennas: r.antennas.length,
          timeMs: r.execution_time_ms,
        })),
      })),
    };
    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonA = document.createElement("a");
    jsonA.href = jsonUrl;
    jsonA.download = `comparison_results_${timestamp}.json`;
    jsonA.click();
    URL.revokeObjectURL(jsonUrl);
  };

  // Compact research export (txt) - tight data without grid positions
  const exportResearchData = (results: ScenarioResult[]) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const lines: string[] = [
      "ALGORITHM COMPARISON - RESEARCH DATA",
      `Generated: ${new Date().toISOString()}`,
      "",
    ];

    results.forEach((sr, idx) => {
      const { scenario, results: algoResults, obstacles } = sr;
      lines.push(`=== SCENARIO ${idx + 1} ===`);
      lines.push(
        `Grid: ${scenario.gridSize}x${scenario.gridSize} | Pattern: ${scenario.pattern} | Houses: ${obstacles.length}`
      );
      lines.push(
        `Constraints: Budget=${scenario.maxBudget || "None"} | MaxAnt=${scenario.maxAntennas || "None"} | Types=${scenario.allowedAntennaTypes.join(",")}`
      );
      lines.push("");
      lines.push("Algorithm\tCoverage%\tCost\tAntennas\tTimeMs\t$/Coverage");

      algoResults.forEach((r) => {
        const costPerCov =
          r.coverage_percentage > 0
            ? (r.total_cost / r.coverage_percentage).toFixed(1)
            : "N/A";
        lines.push(
          `${r.algorithm}\t${r.coverage_percentage.toFixed(2)}\t${r.total_cost}\t${r.antennas.length}\t${r.execution_time_ms.toFixed(1)}\t${costPerCov}`
        );
      });

      lines.push("");
      lines.push("Rankings:");
      const rankings = calculateRankings(algoResults);
      rankings.forEach((r, i) => {
        lines.push(
          `${i + 1}. ${r.algorithm} (Score: ${r.overallScore.toFixed(2)})`
        );
      });
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research_data_${timestamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSingleResult = () => {
    if (!currentSingleResult) return;
    exportBatchResults([
      {
        scenario: currentSingleResult.scenario!,
        results: currentSingleResult.results,
        obstacles: currentSingleResult.obstacles,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Algorithm Comparison
            </h1>
          </div>
          <Link
            href="/research"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all shadow-lg"
          >
            <FlaskConical className="w-5 h-5" />
            View Research
          </Link>
        </div>

        {/* Configuration Panel */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-neutral-400">
            <Settings2 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Configuration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Grid Size */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300">
                Grid Size ({gridSize}×{gridSize})
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Pattern */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300">
                Pattern
              </label>
              <select
                value={selectedPattern}
                onChange={(e) => setSelectedPattern(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                {PATTERNS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Budget */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300">
                Max Budget (optional)
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={maxBudget ?? ""}
                onChange={(e) =>
                  setMaxBudget(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            {/* Max Antennas */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300">
                Max Antennas (optional)
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={maxAntennas ?? ""}
                onChange={(e) =>
                  setMaxAntennas(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          {/* Antenna Types */}
          <div className="mt-6 space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              Antenna Types
            </label>
            <div className="flex flex-wrap gap-2">
              {(["Femto", "Pico", "Micro", "Macro"] as AntennaType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => toggleAntennaType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${allowedAntennaTypes.has(type)
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                      }`}
                  >
                    {type}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={runSingleComparison}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Run Single Test
            </button>
            <button
              onClick={addScenario}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            >
              <Plus className="w-4 h-4" />
              Add to Queue
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-amber-600 hover:bg-amber-500 text-white"
            >
              📂 Import Scenarios
            </button>
            <input
              ref={resultsInputRef}
              type="file"
              accept=".json"
              onChange={handleImportResults}
              className="hidden"
            />
            <button
              onClick={handleImportResultsClick}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-500 text-white"
            >
              📊 Load Results
            </button>
          </div>
        </div>

        {/* Imported Results Preview (for old format files) */}
        {importedResultsPreview && (
          <div className="bg-neutral-900 border border-green-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-green-400">
                <BarChart3 className="w-5 h-5" />
                <h3 className="text-lg font-semibold">
                  📊 Loaded Results Preview (Legacy Format)
                </h3>
              </div>
              <button
                onClick={() => setImportedResultsPreview(null)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Close
              </button>
            </div>
            <div className="bg-neutral-800 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-neutral-300 whitespace-pre-wrap">
                {JSON.stringify(importedResultsPreview, null, 2)}
              </pre>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Note: This file was exported in an older format. Re-run the batch
              test to get full visual results.
            </p>
          </div>
        )}

        {/* Scenario Queue */}
        {scenarios.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-300">
                Queued Scenarios ({scenarios.length})
              </h3>
              <button
                onClick={clearScenarios}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {scenarios.map((s, idx) => {
                const constraintParts: string[] = [];
                if (s.maxBudget)
                  constraintParts.push(`💰$${s.maxBudget.toLocaleString()}`);
                if (s.maxAntennas)
                  constraintParts.push(`📡Max ${s.maxAntennas}`);
                const antTypes = s.allowedAntennaTypes.join("/");
                constraintParts.push(`🔧${antTypes}`);

                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-neutral-800 rounded-lg px-4 py-2"
                  >
                    <span className="text-sm text-neutral-300">
                      {idx + 1}. {s.gridSize}×{s.gridSize} -{" "}
                      {PATTERNS.find((p) => p.name === s.pattern)?.label ||
                        s.pattern}{" "}
                      | {constraintParts.join(" ")}
                    </span>
                    <button
                      onClick={() => removeScenario(s.id)}
                      className="text-neutral-500 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={runBatchScenarios}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Run All Scenarios ({scenarios.length})
            </button>

            {isRunning && batchProgress.total > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-neutral-400 mb-1">
                  <span>Progress</span>
                  <span>
                    {batchProgress.current}/{batchProgress.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single Test Results */}
        {currentSingleResult && currentSingleResult.results.length > 0 && (
          <ResultsSection
            title="Single Test Results"
            results={currentSingleResult.results}
            obstacles={currentSingleResult.obstacles}
            gridSize={currentSingleResult.scenario?.gridSize || gridSize}
            onExport={exportSingleResult}
          />
        )}

        {/* Batch Results */}
        {scenarioResults.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <BarChart3 className="w-5 h-5" />
                <h2 className="text-lg font-semibold">
                  Batch Results ({scenarioResults.length} scenarios)
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white"
                >
                  {showPreview ? "Hide Preview" : "📊 Preview"}
                </button>
                <button
                  onClick={() => exportBatchResults(scenarioResults)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm text-white"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
                <button
                  onClick={() => exportResearchData(scenarioResults)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm text-white"
                >
                  📄 Research TXT
                </button>
              </div>
            </div>

            {/* JSON Preview */}
            {showPreview && (
              <div className="bg-neutral-800 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs text-neutral-300 whitespace-pre-wrap">
                  {JSON.stringify(
                    scenarioResults.map((sr, idx) => ({
                      scenario: `${idx + 1}: ${sr.scenario.gridSize}×${sr.scenario.gridSize} ${sr.scenario.pattern}`,
                      constraints: {
                        budget: sr.scenario.maxBudget
                          ? `$${sr.scenario.maxBudget.toLocaleString()}`
                          : "None",
                        antennas: sr.scenario.maxAntennas || "None",
                      },
                      results: sr.results.map((r) => ({
                        algo: algorithmLabels[r.algorithm] || r.algorithm,
                        coverage: `${r.coverage_percentage.toFixed(1)}%`,
                        cost: `$${r.total_cost.toLocaleString()}`,
                        antennas: r.antennas.length,
                      })),
                    })),
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            {scenarioResults.map((sr, idx) => {
              const constraintParts: string[] = [];
              if (sr.scenario.maxBudget)
                constraintParts.push(
                  `💰$${sr.scenario.maxBudget.toLocaleString()}`
                );
              if (sr.scenario.maxAntennas)
                constraintParts.push(`📡Max ${sr.scenario.maxAntennas}`);
              const antTypes = sr.scenario.allowedAntennaTypes.join("/");
              constraintParts.push(`🔧${antTypes}`);
              const constraintStr = ` | ${constraintParts.join(" ")}`;

              return (
                <ResultsSection
                  key={sr.scenario.id}
                  title={`Scenario ${idx + 1}: ${sr.scenario.gridSize}×${sr.scenario.gridSize} - ${PATTERNS.find((p) => p.name === sr.scenario.pattern)?.label || sr.scenario.pattern}${constraintStr}`}
                  results={sr.results}
                  obstacles={sr.obstacles}
                  gridSize={sr.scenario.gridSize}
                  onExport={() => exportBatchResults([sr])}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Results Section Component
function ResultsSection({
  title,
  results,
  obstacles,
  gridSize,
  onExport,
}: {
  title: string;
  results: OptimizationResponse[];
  obstacles: [number, number][];
  gridSize: number;
  onExport?: () => void;
}) {
  return (
    <div className="space-y-6 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-neutral-300">
          <BarChart3 className="w-5 h-5" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>

      {/* Rankings */}
      <AlgorithmRanking results={results} />

      {/* Charts - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <VerticalBarChart
          title="Area Coverage"
          data={results}
          field="coverage_percentage"
          color="from-emerald-500 to-emerald-600"
          suffix="%"
        />
        <VerticalBarChart
          title="User Coverage"
          data={results}
          field="user_coverage_percentage"
          color="from-teal-500 to-teal-600"
          suffix="%"
        />
        <VerticalBarChart
          title="Cost"
          data={results}
          field="total_cost"
          color="from-amber-500 to-amber-600"
          prefix="$"
        />
      </div>

      {/* Charts - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <VerticalBarChart
          title="Time"
          data={results}
          field="execution_time_ms"
          color="from-blue-500 to-blue-600"
          suffix="ms"
        />
        <VerticalBarChart
          title="Antennas"
          data={results}
          getValue={(r) => r.antennas.length}
          color="from-purple-500 to-purple-600"
        />
        <VerticalBarChart
          title="$/Coverage"
          data={results}
          getValue={(r) =>
            r.coverage_percentage > 0 ? r.total_cost / r.coverage_percentage : 0
          }
          color="from-pink-500 to-pink-600"
          prefix="$"
        />
      </div>

      {/* Grid Visualizations */}
      <div>
        <h4 className="text-sm font-medium text-neutral-400 mb-3">
          Antenna Placements
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
  );
}

// Ranking calculation helper
function calculateRankings(results: OptimizationResponse[]) {
  const rankByCost = [...results].sort((a, b) => a.total_cost - b.total_cost);
  const rankByCoverage = [...results].sort(
    (a, b) => b.coverage_percentage - a.coverage_percentage
  );
  const rankByTime = [...results].sort(
    (a, b) => a.execution_time_ms - b.execution_time_ms
  );
  const rankByAntennas = [...results].sort(
    (a, b) => a.antennas.length - b.antennas.length
  );
  const rankByEfficiency = [...results].sort((a, b) => {
    const effA =
      a.coverage_percentage > 0
        ? a.total_cost / a.coverage_percentage
        : Infinity;
    const effB =
      b.coverage_percentage > 0
        ? b.total_cost / b.coverage_percentage
        : Infinity;
    return effA - effB;
  });

  const scores = results.map((result) => {
    const costRank =
      rankByCost.findIndex((r) => r.algorithm === result.algorithm) + 1;
    const coverageRank =
      rankByCoverage.findIndex((r) => r.algorithm === result.algorithm) + 1;
    const timeRank =
      rankByTime.findIndex((r) => r.algorithm === result.algorithm) + 1;
    const antennasRank =
      rankByAntennas.findIndex((r) => r.algorithm === result.algorithm) + 1;
    const efficiencyRank =
      rankByEfficiency.findIndex((r) => r.algorithm === result.algorithm) + 1;

    const score =
      coverageRank * 2.0 +
      costRank * 1.5 +
      efficiencyRank * 1.0 +
      antennasRank * 0.5 +
      timeRank * 0.25;

    return {
      algorithm: result.algorithm,
      costRank,
      coverageRank,
      timeRank,
      antennasRank,
      efficiencyRank,
      overallScore: score,
    };
  });

  return [...scores].sort((a, b) => a.overallScore - b.overallScore);
}

// Algorithm Ranking Component
function AlgorithmRanking({ results }: { results: OptimizationResponse[] }) {
  const rankedScores = calculateRankings(results);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-slate-300";
    if (rank === 3) return "text-amber-600";
    return "text-neutral-500";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="text-left py-2 px-2 text-neutral-400 font-medium">
              Rank
            </th>
            <th className="text-left py-2 px-2 text-neutral-400 font-medium">
              Algorithm
            </th>
            <th className="text-center py-2 px-2 text-neutral-400 font-medium">
              Coverage
            </th>
            <th className="text-center py-2 px-2 text-neutral-400 font-medium">
              Cost
            </th>
            <th className="text-center py-2 px-2 text-neutral-400 font-medium">
              Efficiency
            </th>
            <th className="text-center py-2 px-2 text-neutral-400 font-medium">
              Antennas
            </th>
            <th className="text-center py-2 px-2 text-neutral-400 font-medium">
              Time
            </th>
            <th className="text-center py-2 px-2 text-neutral-400 font-medium">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {rankedScores.map((score, index) => (
            <tr
              key={score.algorithm}
              className="border-b border-neutral-800/50 hover:bg-neutral-800/30"
            >
              <td className="py-2 px-2">
                <span className={`text-lg ${getRankColor(index + 1)}`}>
                  {getRankBadge(index + 1)}
                </span>
              </td>
              <td className="py-2 px-2">
                <span className="text-neutral-200 font-medium">
                  {algorithmLabels[score.algorithm] || score.algorithm}
                </span>
              </td>
              <td className="text-center py-2 px-2">
                <span className={getRankColor(score.coverageRank)}>
                  #{score.coverageRank}
                </span>
              </td>
              <td className="text-center py-2 px-2">
                <span className={getRankColor(score.costRank)}>
                  #{score.costRank}
                </span>
              </td>
              <td className="text-center py-2 px-2">
                <span className={getRankColor(score.efficiencyRank)}>
                  #{score.efficiencyRank}
                </span>
              </td>
              <td className="text-center py-2 px-2">
                <span className={getRankColor(score.antennasRank)}>
                  #{score.antennasRank}
                </span>
              </td>
              <td className="text-center py-2 px-2">
                <span className={getRankColor(score.timeRank)}>
                  #{score.timeRank}
                </span>
              </td>
              <td className="text-center py-2 px-2">
                <span className="text-neutral-400">
                  {score.overallScore.toFixed(2)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-neutral-500 mt-2">
        Score formula: Coverage×2 + Cost×1.5 + Efficiency×1 + Antennas×0.5 +
        Time×0.25 (lower is better)
      </p>
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
  const cellSize = Math.max(2, Math.min(6, 120 / gridSize));

  const antennaColors: Record<string, string> = {
    Femto: "bg-purple-500",
    Pico: "bg-cyan-500",
    Micro: "bg-green-500",
    Macro: "bg-red-500",
  };

  return (
    <div className="bg-neutral-800 rounded-lg p-2">
      <div className="text-xs font-medium text-neutral-300 mb-1 truncate">
        {algorithmLabels[result.algorithm] || result.algorithm}
      </div>
      <div
        className="relative bg-neutral-950 rounded overflow-hidden"
        style={{
          width: `${cellSize * gridSize}px`,
          height: `${cellSize * gridSize}px`,
        }}
      >
        {obstacles.map(([x, y], idx) => (
          <div
            key={`h-${idx}`}
            className="absolute bg-amber-500/40"
            style={{
              left: `${x * cellSize}px`,
              top: `${y * cellSize}px`,
              width: `${cellSize}px`,
              height: `${cellSize}px`,
            }}
          />
        ))}
        {result.antennas.map((antenna, idx) => (
          <div
            key={`a-${idx}`}
            className={`absolute rounded-full ${antennaColors[antenna.type] || "bg-blue-500"}`}
            style={{
              left: `${antenna.x * cellSize}px`,
              top: `${antenna.y * cellSize}px`,
              width: `${cellSize}px`,
              height: `${cellSize}px`,
            }}
          />
        ))}
      </div>
      <div className="text-[10px] text-neutral-500 mt-1">
        {result.antennas.length} ant. • ${result.total_cost.toLocaleString()}
      </div>
    </div>
  );
}

// Bar chart component
function VerticalBarChart({
  title,
  data,
  field,
  getValue,
  color,
  prefix = "",
  suffix = "",
}: {
  title: string;
  data: OptimizationResponse[];
  field?: keyof OptimizationResponse;
  getValue?: (r: OptimizationResponse) => number;
  color: string;
  prefix?: string;
  suffix?: string;
}) {
  const values = data.map((r) =>
    getValue ? getValue(r) : Number(r[field!]) || 0
  );
  const maxValue = Math.max(...values, 1);

  return (
    <div className="bg-neutral-800 rounded-lg p-3 flex flex-col h-64">
      <h4 className="text-xs font-medium text-neutral-400 mb-2">{title}</h4>
      <div className="flex-1 flex items-end justify-around gap-1">
        {data.map((result, idx) => {
          const value = values[idx];
          const percentage = Math.max((value / maxValue) * 100, 5);

          return (
            <div
              key={result.algorithm}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="relative flex justify-center items-end h-32">
                <div
                  className={`w-6 rounded-t bg-linear-to-t ${color} opacity-80 group-hover:opacity-100 transition-all`}
                  style={{ height: `${percentage}%` }}
                />
              </div>
              <div className="text-[8px] text-neutral-500 truncate w-8 text-center">
                {algorithmLabels[result.algorithm]?.slice(0, 4) ||
                  result.algorithm.slice(0, 4)}
              </div>
              <div className="text-[8px] text-neutral-400">
                {prefix}
                {value >= 10000
                  ? `${(value / 1000).toFixed(0)}k`
                  : value.toFixed(0)}
                {suffix}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
