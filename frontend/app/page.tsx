"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GridMap, CellType } from "@/components/grid-map";
import { CanvasGrid } from "@/components/canvas-grid";
import { GridSeedingPanel } from "@/components/grid-seeding-panel";
import { CalculationPanel } from "@/components/calculation-panel";
import { StatsCard } from "@/components/stats-card";
import {
  API_CONFIG,
  AntennaType,
  OptimizationResponse,
  AntennaSpec,
} from "@/lib/api-config";

const DEFAULT_ROWS = 15;
const DEFAULT_COLS = 20;
const MAX_GRID_SIZE = 1000;
const COST_PER_ANTENNA = 5000;
const USERS_PER_HOUSE = 20;

export default function Home() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [grid, setGrid] = useState<CellType[][]>([]);
  // Store antenna type for manually placed antennas
  const [manualAntennas, setManualAntennas] = useState<
    Map<string, AntennaType>
  >(new Map());
  const [targetCoverage, setTargetCoverage] = useState(95);
  const [editMode, setEditMode] = useState<"house" | "antenna">("house");
  const [selectedAntennaType, setSelectedAntennaType] =
    useState<AntennaType>("Pico");
  const [algorithm, setAlgorithm] = useState<
    "greedy" | "genetic" | "simulated-annealing" | "brute-force"
  >("greedy");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [antennaSpecs, setAntennaSpecs] = useState<AntennaSpec[]>([]);
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResponse | null>(null);

  // Derived state for coverage visualization
  const [coverage, setCoverage] = useState<boolean[][]>([]);

  // Fetch antenna types on mount
  useEffect(() => {
    const fetchAntennaTypes = async () => {
      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANTENNA_TYPES}`
        );
        if (response.ok) {
          const data = await response.json();
          setAntennaSpecs(data.antenna_types);
        }
      } catch (error) {
        console.error("Failed to fetch antenna types:", error);
      }
    };
    fetchAntennaTypes();
  }, []);

  // Initialize grid
  useEffect(() => {
    // Validate grid size
    const validRows = Math.min(Math.max(1, rows), MAX_GRID_SIZE);
    const validCols = Math.min(Math.max(1, cols), MAX_GRID_SIZE);

    if (validRows !== rows) setRows(validRows);
    if (validCols !== cols) setCols(validCols);

    setGrid((prev) => {
      const newGrid = new Array(validRows);
      for (let i = 0; i < validRows; i++) {
        newGrid[i] = new Array(validCols).fill("empty");
      }
      return newGrid as CellType[][];
    });
    setOptimizationResult(null);
  }, [rows, cols]);

  // Calculate coverage based on optimization result
  const calculateCoverage = useCallback(() => {
    if (!optimizationResult || grid.length === 0) {
      const emptyRows = new Array(grid.length);
      for (let i = 0; i < grid.length; i++) {
        emptyRows[i] = new Array(grid[0]?.length || 0).fill(false);
      }
      setCoverage(emptyRows);
      return;
    }

    const newCoverage = new Array(grid.length);
    for (let i = 0; i < grid.length; i++) {
      newCoverage[i] = new Array(grid[0].length).fill(false);
    }

    for (const antenna of optimizationResult.antennas) {
      const r = antenna.radius;
      for (let i = -r; i <= r; i++) {
        for (let j = -r; j <= r; j++) {
          if (i * i + j * j <= r * r) {
            const targetY = antenna.y + i;
            const targetX = antenna.x + j;
            if (
              targetY >= 0 &&
              targetY < grid.length &&
              targetX >= 0 &&
              targetX < grid[0].length
            ) {
              newCoverage[targetY][targetX] = true;
            }
          }
        }
      }
    }

    setCoverage(newCoverage);
  }, [grid, optimizationResult]);

  useEffect(() => {
    calculateCoverage();
  }, [calculateCoverage]);

  const handleCellClick = (r: number, c: number) => {
    const newGrid = [...grid.map((row) => [...row])];
    const current = newGrid[r][c];

    if (editMode === "house") {
      newGrid[r][c] = current === "house" ? "empty" : "house";
    } else {
      const key = `${r},${c}`;
      if (current === "antenna") {
        // Remove antenna
        newGrid[r][c] = "empty";
        setManualAntennas((prev) => {
          const updated = new Map(prev);
          updated.delete(key);
          return updated;
        });
      } else {
        // Place antenna with current selected type
        newGrid[r][c] = "antenna";
        setManualAntennas((prev) => {
          const updated = new Map(prev);
          updated.set(key, selectedAntennaType);
          return updated;
        });
      }
    }
    setGrid(newGrid);
  };

  const handleRandomize = () => {
    const newGrid = new Array(rows);
    const houseProbability = rows * cols > 50000 ? 0.05 : 0.15; // Lower density for large grids

    for (let r = 0; r < rows; r++) {
      newGrid[r] = new Array(cols);
      for (let c = 0; c < cols; c++) {
        newGrid[r][c] = Math.random() < houseProbability ? "house" : "empty";
      }
    }
    setGrid(newGrid as CellType[][]);
    setManualAntennas(new Map());
    setOptimizationResult(null);
  };

  const handleClear = () => {
    const newGrid = new Array(rows);
    for (let i = 0; i < rows; i++) {
      newGrid[i] = new Array(cols).fill("empty");
    }
    setGrid(newGrid as CellType[][]);
    setManualAntennas(new Map());
    setOptimizationResult(null);
  };

  const runOptimization = async () => {
    setIsOptimizing(true);

    try {
      // Clear existing antennas
      let currentGrid: CellType[][] = grid.map((row) =>
        row.map((cell) => (cell === "antenna" ? "empty" : cell))
      );
      setGrid(currentGrid);
      setOptimizationResult(null);

      // Allow UI to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Collect house positions (obstacles)
      const obstacles: [number, number][] = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (currentGrid[y][x] === "house") {
            obstacles.push([x, y]);
          }
        }
      }

      // Call FastAPI backend
      const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OPTIMIZE}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          width: cols,
          height: rows,
          target_coverage: targetCoverage,
          obstacles: obstacles,
          algorithm: algorithm,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || "Optimization failed");
      }

      const data: OptimizationResponse = await response.json();
      setOptimizationResult(data);

      // Place antennas with animation
      for (const antenna of data.antennas) {
        currentGrid = currentGrid.map((row) => [...row]);
        currentGrid[antenna.y][antenna.x] = "antenna";
        setGrid(currentGrid);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error("Optimization error:", error);
      alert(
        `Optimization failed: ${error instanceof Error ? error.message : "Please try again."}`
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  // Stats
  const totalHouses = grid.flat().filter((c) => c === "house").length;
  const totalUsers = totalHouses * USERS_PER_HOUSE;
  const antennaCount = grid.flat().filter((c) => c === "antenna").length;
  const coveredHousesCount = grid.flat().reduce((acc, cell, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    if (cell === "house" && coverage[r]?.[c]) return acc + 1;
    return acc;
  }, 0);
  const coveredUsers = coveredHousesCount * USERS_PER_HOUSE;

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent glow-text">
            Cellular Network Optimizer
          </h1>
          <p className="text-slate-400 text-lg">
            Interactive simulation for optimal antenna placement and coverage
            analysis.
          </p>
        </div>

        <StatsCard
          totalHouses={totalHouses}
          coveredHouses={coveredHousesCount}
          totalUsers={totalUsers}
          coveredUsers={coveredUsers}
          antennaCount={antennaCount}
          costPerAntenna={COST_PER_ANTENNA}
          optimizationResult={optimizationResult}
        />

        <CalculationPanel
          targetCoverage={targetCoverage}
          setTargetCoverage={setTargetCoverage}
          algorithm={algorithm}
          setAlgorithm={setAlgorithm}
          antennaSpecs={antennaSpecs}
          onOptimize={runOptimization}
          isOptimizing={isOptimizing}
        />

        <GridSeedingPanel
          rows={rows}
          cols={cols}
          setRows={setRows}
          setCols={setCols}
          editMode={editMode}
          setEditMode={setEditMode}
          selectedAntennaType={selectedAntennaType}
          setSelectedAntennaType={setSelectedAntennaType}
          onRandomize={handleRandomize}
          onClear={handleClear}
        />

        <div className="w-full">
          {rows * cols > 10000 ? (
            <CanvasGrid
              rows={rows}
              cols={cols}
              grid={grid}
              onCellClick={handleCellClick}
              coverage={coverage}
              antennaData={optimizationResult?.antennas}
              manualAntennas={manualAntennas}
              antennaSpecs={antennaSpecs}
            />
          ) : (
            <GridMap
              rows={rows}
              cols={cols}
              grid={grid}
              onCellClick={handleCellClick}
              coverage={coverage}
              antennaData={optimizationResult?.antennas}
              selectedAntennaType={selectedAntennaType}
              manualAntennas={manualAntennas}
              antennaSpecs={antennaSpecs}
            />
          )}
        </div>
      </div>
    </main>
  );
}
