"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GridMap, CellType } from "@/components/grid-map";
import { ControlPanel } from "@/components/control-panel";
import { StatsCard } from "@/components/stats-card";
import {
  API_CONFIG,
  AntennaType,
  OptimizationResponse,
  AntennaSpec,
} from "@/lib/api-config";

const DEFAULT_ROWS = 15;
const DEFAULT_COLS = 20;
const COST_PER_ANTENNA = 5000;
const USERS_PER_HOUSE = 10;

export default function Home() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [targetCoverage, setTargetCoverage] = useState(95);
  const [editMode, setEditMode] = useState<"house" | "antenna">("house");
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
    setGrid((prev) => {
      const newGrid = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill("empty"));
      return newGrid as CellType[][];
    });
    setOptimizationResult(null);
  }, [rows, cols]);

  // Calculate coverage based on optimization result
  const calculateCoverage = useCallback(() => {
    if (!optimizationResult || grid.length === 0) {
      setCoverage(
        Array(grid.length)
          .fill(null)
          .map(() => Array(grid[0]?.length || 0).fill(false))
      );
      return;
    }

    const newCoverage = Array(grid.length)
      .fill(null)
      .map(() => Array(grid[0]?.length || 0).fill(false));

    optimizationResult.antennas.forEach((antenna) => {
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
    });

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
      newGrid[r][c] = current === "antenna" ? "empty" : "antenna";
    }
    setGrid(newGrid);
  };

  const handleRandomize = () => {
    const newGrid = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill("empty"));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.15) {
          // 15% chance of house
          newGrid[r][c] = "house";
        }
      }
    }
    setGrid(newGrid as CellType[][]);
  };

  const handleClear = () => {
    setGrid(
      Array(rows)
        .fill(null)
        .map(() => Array(cols).fill("empty")) as CellType[][]
    );
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

        <ControlPanel
          rows={rows}
          cols={cols}
          setRows={setRows}
          setCols={setCols}
          targetCoverage={targetCoverage}
          setTargetCoverage={setTargetCoverage}
          antennaSpecs={antennaSpecs}
          editMode={editMode}
          setEditMode={setEditMode}
          algorithm={algorithm}
          setAlgorithm={setAlgorithm}
          onRandomize={handleRandomize}
          onClear={handleClear}
          onOptimize={runOptimization}
          isOptimizing={isOptimizing}
        />

        <div className="w-full">
          <GridMap
            rows={rows}
            cols={cols}
            grid={grid}
            onCellClick={handleCellClick}
            coverage={coverage}
            antennaData={optimizationResult?.antennas}
          />
        </div>
      </div>
    </main>
  );
}
