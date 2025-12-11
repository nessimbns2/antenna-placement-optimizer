"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { GridMap, CellType } from "@/components/grid-map";
import { CanvasGrid } from "@/components/canvas-grid";
import { GridSeedingPanel } from "@/components/grid-seeding-panel";
import { CalculationPanel } from "@/components/calculation-panel";
import { StatsCard } from "@/components/stats-card";
import {
  API_CONFIG,
  AntennaType,
  OptimizationResponse,
  OptimizationProgress,
  AntennaSpec,
} from "@/lib/api-config";
import {
  exportSolution,
  importSolution,
  applySolutionData,
} from "@/lib/solution-export";

const DEFAULT_ROWS = 20;
const DEFAULT_COLS = 20;
const MAX_GRID_SIZE = 350;
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
  const [editMode, setEditMode] = useState<"house" | "antenna">("house");
  const [selectedAntennaType, setSelectedAntennaType] =
    useState<AntennaType>("Pico");
  const [selectedPattern, setSelectedPattern] = useState<string>("random");
  const [algorithm, setAlgorithm] = useState<
    "greedy" | "genetic" | "simulated-annealing" | "tabu-search" | "hill-climbing" | "vns" | "brute-force"
  >("greedy");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [antennaSpecs, setAntennaSpecs] = useState<AntennaSpec[]>([]);
  const [allowedAntennaTypes, setAllowedAntennaTypes] = useState<
    Set<AntennaType>
  >(new Set<AntennaType>(["Femto", "Pico", "Micro", "Macro"]));
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResponse | null>(null);

  // Derived state for coverage visualization
  const [coverage, setCoverage] = useState<boolean[][]>([]);
  const [gridSize, setGridSize] = useState(DEFAULT_ROWS); // 1:1 ratio
  const [forceCanvas, setForceCanvas] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Streaming optimization state
  const [streamingMode, setStreamingMode] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamStats, setStreamStats] = useState<{
    iteration: number;
    temperature: number;
    energy: number;
    acceptanceRate: number;
  } | null>(null);

  // Fetch antenna types on mount
  useEffect(() => {
    const fetchAntennaTypes = async () => {
      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANTENNA_TYPES}`
        );
        if (response.ok) {
          const data = await response.json();
          setAntennaSpecs(data.antenna_types || []);
        }
      } catch (error) {
        console.error("Failed to fetch antenna types", error);
      }
    };
    fetchAntennaTypes();
  }, []);

  // Auto-generate when pattern changes (except on initial load)
  useEffect(() => {
    // Skip if grid hasn't been initialized yet
    if (grid.length === 0) return;

    // Auto-generate when pattern changes from dropdown
    handleRandomize();
  }, [selectedPattern]);

  // Sync rows and cols with gridSize (1:1 ratio)
  useEffect(() => {
    setRows(gridSize);
    setCols(gridSize);
  }, [gridSize]);

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

  const handleRandomize = (patternName?: string) => {
    const newGrid: CellType[][] = new Array(rows);
    for (let r = 0; r < rows; r++) {
      newGrid[r] = new Array(cols).fill("empty");
    }

    // All available patterns with metadata
    const allPatterns = [
      {
        name: "circular_clusters",
        label: "Circular Clusters",
        weight: 15,
        fn: generateCircularClusters,
      },
      {
        name: "isolated_houses",
        label: "Isolated Houses",
        weight: 12,
        fn: generateIsolatedHouses,
      },
      {
        name: "urban_grid",
        label: "Urban Grid",
        weight: 12,
        fn: generateUrbanGrid,
      },
      {
        name: "suburban_spread",
        label: "Suburban Spread",
        weight: 12,
        fn: generateSuburbanSpread,
      },
      {
        name: "linear_streets",
        label: "Linear Streets",
        weight: 8,
        fn: generateLinearStreets,
      },
      {
        name: "random_scattered",
        label: "Random Scattered",
        weight: 8,
        fn: generateRandomScattered,
      },
      {
        name: "dense_downtown",
        label: "Dense Downtown",
        weight: 5,
        fn: generateDenseDowntown,
      },
      {
        name: "donut_ring",
        label: "Donut Ring",
        weight: 6,
        fn: generateDonutRing,
      },
      {
        name: "diagonal_lines",
        label: "Diagonal Lines",
        weight: 6,
        fn: generateDiagonalLines,
      },
      {
        name: "coastal_settlement",
        label: "Coastal Settlement",
        weight: 5,
        fn: generateCoastalSettlement,
      },
      {
        name: "mountain_valley",
        label: "Mountain Valley",
        weight: 5,
        fn: generateMountainValley,
      },
      {
        name: "checkerboard",
        label: "Checkerboard",
        weight: 4,
        fn: generateCheckerboard,
      },
      {
        name: "riverside_towns",
        label: "Riverside Towns",
        weight: 4,
        fn: generateRiversideTowns,
      },
      {
        name: "highway_network",
        label: "Highway Network",
        weight: 3,
        fn: generateHighwayNetwork,
      },
    ];

    // If specific pattern selected, use it
    const usePattern = patternName || selectedPattern;

    if (usePattern !== "random") {
      const pattern = allPatterns.find((p) => p.name === usePattern);
      if (pattern) {
        pattern.fn(newGrid, rows, cols);
      }
    } else {
      // Random selection based on weighted probability
      const totalWeight = allPatterns.reduce((sum, p) => sum + p.weight, 0);
      const random = Math.random() * totalWeight;
      let cumulativeWeight = 0;

      for (const pattern of allPatterns) {
        cumulativeWeight += pattern.weight;
        if (random <= cumulativeWeight) {
          pattern.fn(newGrid, rows, cols);
          break;
        }
      }
    }

    setGrid(newGrid);
    setManualAntennas(new Map());
    setOptimizationResult(null);
  };

  // Pattern 1: Circular Clusters with High Density (25% chance)
  const generateCircularClusters = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const numClusters = Math.floor(Math.random() * 3) + 3; // 3-5 clusters
    for (let i = 0; i < numClusters; i++) {
      const centerX = Math.floor(Math.random() * cols);
      const centerY = Math.floor(Math.random() * rows);
      const radius = Math.floor(Math.random() * 8) + 5; // radius 5-12

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (distance <= radius && Math.random() < 0.6) {
            grid[y][x] = "house";
          }
        }
      }
    }
  };

  // Pattern 2: Isolated Houses with Buffer Zones (20% chance)
  const generateIsolatedHouses = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const numHouses = Math.floor(rows * cols * 0.08); // 8% coverage
    const minDistance = 8; // Minimum distance between houses

    const placedHouses: { x: number; y: number }[] = [];

    for (let i = 0; i < numHouses; i++) {
      let attempts = 0;
      let placed = false;

      while (attempts < 50 && !placed) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);

        // Check distance from all placed houses
        const tooClose = placedHouses.some(
          (house) =>
            Math.sqrt((x - house.x) ** 2 + (y - house.y) ** 2) < minDistance
        );

        if (!tooClose) {
          grid[y][x] = "house";
          placedHouses.push({ x, y });
          placed = true;
        }
        attempts++;
      }
    }
  };

  // Pattern 3: Urban Grid Layout (15% chance)
  const generateUrbanGrid = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const blockSize = 6;
    const streetWidth = 2;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const inStreetX = x % (blockSize + streetWidth) < streetWidth;
        const inStreetY = y % (blockSize + streetWidth) < streetWidth;

        // Place houses in blocks, leave streets empty
        if (!inStreetX && !inStreetY && Math.random() < 0.7) {
          grid[y][x] = "house";
        }
      }
    }
  };

  // Pattern 4: Suburban Spread (15% chance)
  const generateSuburbanSpread = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const density = 0.12; // 12% base density
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Create clusters using Perlin-like noise simulation
        const clusterX = Math.floor(x / 10);
        const clusterY = Math.floor(y / 10);
        const clusterSeed = (clusterX * 73856093) ^ (clusterY * 19349663);
        const clusterDensity = ((clusterSeed % 100) / 100) * 0.3;

        if (Math.random() < density + clusterDensity) {
          grid[y][x] = "house";
        }
      }
    }
  };

  // Pattern 5: Linear Streets (10% chance)
  const generateLinearStreets = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const numStreets = Math.floor(Math.random() * 4) + 3; // 3-6 streets

    for (let i = 0; i < numStreets; i++) {
      const isHorizontal = Math.random() < 0.5;
      const position = isHorizontal
        ? Math.floor(Math.random() * rows)
        : Math.floor(Math.random() * cols);

      if (isHorizontal) {
        for (let x = 0; x < cols; x++) {
          if (Math.random() < 0.5) {
            // Houses on both sides of street
            if (position > 0) grid[position - 1][x] = "house";
            if (position < rows - 1) grid[position + 1][x] = "house";
          }
        }
      } else {
        for (let y = 0; y < rows; y++) {
          if (Math.random() < 0.5) {
            if (position > 0) grid[y][position - 1] = "house";
            if (position < cols - 1) grid[y][position + 1] = "house";
          }
        }
      }
    }
  };

  // Pattern 6: Random Scattered (10% chance)
  const generateRandomScattered = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const houseProbability = rows * cols > 50000 ? 0.05 : 0.15;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (Math.random() < houseProbability) {
          grid[y][x] = "house";
        }
      }
    }
  };

  // Pattern 7: Dense Downtown (5% chance)
  const generateDenseDowntown = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    const maxRadius = Math.min(rows, cols) / 3;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const density = Math.max(0, 1 - distance / maxRadius); // Higher density near center

        if (Math.random() < density * 0.9) {
          grid[y][x] = "house";
        }
      }
    }
  };

  // Pattern 8: Donut Ring
  const generateDonutRing = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    const outerRadius = Math.min(rows, cols) / 3;
    const innerRadius = outerRadius * 0.5;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (
          distance >= innerRadius &&
          distance <= outerRadius &&
          Math.random() < 0.7
        ) {
          grid[y][x] = "house";
        }
      }
    }
  };

  // Pattern 9: Diagonal Lines
  const generateDiagonalLines = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const numLines = Math.floor(Math.random() * 3) + 4; // 4-6 diagonal lines
    const spacing = Math.max(rows, cols) / numLines;

    for (let line = 0; line < numLines; line++) {
      const offset = line * spacing;
      for (let i = 0; i < Math.max(rows, cols); i++) {
        const x = Math.floor(i + offset);
        const y = i;
        if (x >= 0 && x < cols && y >= 0 && y < rows && Math.random() < 0.6) {
          grid[y][x] = "house";
          // Add houses adjacent to diagonal
          if (Math.random() < 0.4) {
            if (x + 1 < cols) grid[y][x + 1] = "house";
            if (x - 1 >= 0) grid[y][x - 1] = "house";
          }
        }
      }
    }
  };

  // Pattern 10: Coastal Settlement
  const generateCoastalSettlement = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    // Create a "coastline" on one side
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    const coastDepth = Math.floor(Math.min(rows, cols) * 0.3);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let nearCoast = false;
        if (side === 0) nearCoast = y < coastDepth;
        else if (side === 1) nearCoast = x >= cols - coastDepth;
        else if (side === 2) nearCoast = y >= rows - coastDepth;
        else nearCoast = x < coastDepth;

        if (nearCoast && Math.random() < 0.5) {
          grid[y][x] = "house";
        }
      }
    }
  };

  // Pattern 11: Mountain Valley
  const generateMountainValley = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const isHorizontal = Math.random() < 0.5;
    const valleyWidth = Math.floor((isHorizontal ? rows : cols) * 0.3);
    const valleyCenter = isHorizontal
      ? Math.floor(rows / 2)
      : Math.floor(cols / 2);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const distFromCenter = isHorizontal
          ? Math.abs(y - valleyCenter)
          : Math.abs(x - valleyCenter);

        if (distFromCenter <= valleyWidth / 2 && Math.random() < 0.6) {
          grid[y][x] = "house";
        }
      }
    }
  };

  // Pattern 12: Checkerboard
  const generateCheckerboard = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    const blockSize = 8;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const blockX = Math.floor(x / blockSize);
        const blockY = Math.floor(y / blockSize);
        const isFilledBlock = (blockX + blockY) % 2 === 0;

        if (isFilledBlock && Math.random() < 0.5) {
          grid[y][x] = "house";
        }
      }
    }
  };

  // Pattern 13: Riverside Towns
  const generateRiversideTowns = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    // Create a winding river through the middle
    const isVertical = Math.random() < 0.5;
    const riverPath: number[] = [];

    if (isVertical) {
      let currentX = Math.floor(cols / 2);
      for (let y = 0; y < rows; y++) {
        riverPath.push(currentX);
        // River meanders
        currentX += Math.floor(Math.random() * 3) - 1;
        currentX = Math.max(2, Math.min(cols - 3, currentX));
      }

      // Place houses along riverbanks
      for (let y = 0; y < rows; y++) {
        const riverX = riverPath[y];
        for (let offset = 2; offset <= 5; offset++) {
          if (riverX - offset >= 0 && Math.random() < 0.4)
            grid[y][riverX - offset] = "house";
          if (riverX + offset < cols && Math.random() < 0.4)
            grid[y][riverX + offset] = "house";
        }
      }
    } else {
      let currentY = Math.floor(rows / 2);
      for (let x = 0; x < cols; x++) {
        riverPath.push(currentY);
        currentY += Math.floor(Math.random() * 3) - 1;
        currentY = Math.max(2, Math.min(rows - 3, currentY));
      }

      for (let x = 0; x < cols; x++) {
        const riverY = riverPath[x];
        for (let offset = 2; offset <= 5; offset++) {
          if (riverY - offset >= 0 && Math.random() < 0.4)
            grid[riverY - offset][x] = "house";
          if (riverY + offset < rows && Math.random() < 0.4)
            grid[riverY + offset][x] = "house";
        }
      }
    }
  };

  // Pattern 14: Highway Network
  const generateHighwayNetwork = (
    grid: CellType[][],
    rows: number,
    cols: number
  ) => {
    // Create major highways
    const numHighways = Math.floor(Math.random() * 2) + 2; // 2-3 highways

    for (let i = 0; i < numHighways; i++) {
      const isHorizontal = i % 2 === 0;
      const position = isHorizontal
        ? Math.floor(((i + 1) * rows) / (numHighways + 1))
        : Math.floor(((i + 1) * cols) / (numHighways + 1));

      if (isHorizontal) {
        // Horizontal highway with rest stops and nearby houses
        for (let x = 0; x < cols; x++) {
          if (x % 15 === 0) {
            // Rest stop area
            for (let dy = -3; dy <= 3; dy++) {
              for (let dx = -3; dx <= 3; dx++) {
                const ny = position + dy;
                const nx = x + dx;
                if (
                  ny >= 0 &&
                  ny < rows &&
                  nx >= 0 &&
                  nx < cols &&
                  Math.random() < 0.6
                ) {
                  grid[ny][nx] = "house";
                }
              }
            }
          }
        }
      } else {
        for (let y = 0; y < rows; y++) {
          if (y % 15 === 0) {
            for (let dy = -3; dy <= 3; dy++) {
              for (let dx = -3; dx <= 3; dx++) {
                const ny = y + dy;
                const nx = position + dx;
                if (
                  ny >= 0 &&
                  ny < rows &&
                  nx >= 0 &&
                  nx < cols &&
                  Math.random() < 0.6
                ) {
                  grid[ny][nx] = "house";
                }
              }
            }
          }
        }
      }
    }
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

  const runOptimization = async (params: {
    maxBudget?: number;
    maxAntennas?: number;
  }) => {
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
          max_budget: params.maxBudget,
          max_antennas: params.maxAntennas,
          obstacles: obstacles,
          algorithm: algorithm,
          allowed_antenna_types: Array.from(allowedAntennaTypes),
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

  // Streaming optimization for real-time visualization
  const runStreamingOptimization = async (params: {
    maxBudget?: number;
    maxAntennas?: number;
  }) => {
    if (algorithm !== "simulated-annealing") {
      // Fall back to regular optimization for non-SA algorithms
      runOptimization(params);
      return;
    }

    setIsOptimizing(true);
    setStreamProgress(0);
    setStreamStats(null);

    try {
      // Clear existing antennas
      const currentGrid: CellType[][] = grid.map((row) =>
        row.map((cell) => (cell === "antenna" ? "empty" : cell))
      );
      setGrid(currentGrid);
      setOptimizationResult(null);

      // Collect house positions
      const obstacles: [number, number][] = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (currentGrid[y][x] === "house") {
            obstacles.push([x, y]);
          }
        }
      }

      // Create SSE request
      const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OPTIMIZE_STREAM}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({
          width: cols,
          height: rows,
          max_budget: params.maxBudget,
          max_antennas: params.maxAntennas,
          obstacles: obstacles,
          algorithm: "simulated-annealing",
          allowed_antenna_types: Array.from(allowedAntennaTypes),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || "Streaming optimization failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const progress: OptimizationProgress = JSON.parse(line.slice(6));

              // Update progress stats
              setStreamProgress(progress.progress_percent);
              setStreamStats({
                iteration: progress.iteration,
                temperature: progress.temperature,
                energy: progress.best_energy,
                acceptanceRate: progress.acceptance_rate,
              });

              // Update grid with current antennas - use functional update to avoid stale closure
              setGrid((prevGrid) => {
                const newGrid = prevGrid.map((row) =>
                  row.map((cell) => (cell === "antenna" ? "empty" : cell))
                ) as CellType[][];

                for (const antenna of progress.antennas) {
                  if (newGrid[antenna.y] && newGrid[antenna.y][antenna.x] !== "house") {
                    newGrid[antenna.y][antenna.x] = "antenna";
                  }
                }
                return newGrid;
              });

              // Handle completion
              if (progress.event_type === "complete") {
                setOptimizationResult({
                  antennas: progress.antennas,
                  coverage_percentage: progress.coverage_percentage || 0,
                  users_covered: progress.users_covered,
                  total_users: progress.total_users,
                  user_coverage_percentage: progress.user_coverage_percentage || 0,
                  total_cost: progress.total_cost,
                  algorithm: "simulated-annealing",
                  execution_time_ms: 0,
                });
              }

              // Handle error
              if (progress.event_type === "error") {
                throw new Error(progress.detail || "Streaming error");
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming optimization error:", error);
      alert(
        `Streaming optimization failed: ${error instanceof Error ? error.message : "Please try again."}`
      );
    } finally {
      setIsOptimizing(false);
      setStreamProgress(0);
      setStreamStats(null);
    }
  };

  // Export/Import handlers
  const handleExport = () => {
    exportSolution(
      rows,
      cols,
      grid,
      manualAntennas,
      optimizationResult,
      algorithm,
      allowedAntennaTypes
    );
  };

  const handleImport = async (file: File) => {
    const data = await importSolution(file);
    if (data) {
      applySolutionData(data, {
        setRows,
        setCols,
        setGrid,
        setManualAntennas,
        setOptimizationResult,
        setAlgorithm,
        setAllowedAntennaTypes,
      });
      // Update grid size to match imported data
      setGridSize(data.gridSize.rows);
    } else {
      alert("Failed to import solution. Please check the file format.");
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent glow-text">
              Cellular Network Optimizer
            </h1>
            <p className="text-slate-400 text-lg">
              Interactive simulation for optimal antenna placement and coverage
              analysis.
            </p>
          </div>
          <Link
            href="/compare"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all border border-slate-700 shadow-lg"
          >
            <BarChart3 className="w-5 h-5" />
            Compare Algorithms
          </Link>
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
          algorithm={algorithm}
          setAlgorithm={setAlgorithm}
          antennaSpecs={antennaSpecs}
          allowedAntennaTypes={allowedAntennaTypes}
          setAllowedAntennaTypes={setAllowedAntennaTypes}
          onOptimize={streamingMode ? runStreamingOptimization : runOptimization}
          isOptimizing={isOptimizing}
          streamingMode={streamingMode}
          setStreamingMode={setStreamingMode}
          streamProgress={streamProgress}
          streamStats={streamStats}
        />

        <GridSeedingPanel
          gridSize={gridSize}
          setGridSize={setGridSize}
          editMode={editMode}
          setEditMode={setEditMode}
          selectedAntennaType={selectedAntennaType}
          setSelectedAntennaType={setSelectedAntennaType}
          selectedPattern={selectedPattern}
          setSelectedPattern={setSelectedPattern}
          onClear={handleClear}
          forceCanvas={forceCanvas}
          setForceCanvas={setForceCanvas}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          totalCells={rows * cols}
          onExport={handleExport}
          onImport={handleImport}
        />

        <div
          className={
            isFullscreen
              ? "fixed inset-0 z-50 bg-slate-950 p-4 flex flex-col"
              : "w-full"
          }
        >
          {isFullscreen && (
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg"
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
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                Exit Fullscreen
              </button>
            </div>
          )}
          <div
            className={
              isFullscreen ? "flex-1 flex items-center justify-center" : ""
            }
          >
            {rows * cols > 10000 || forceCanvas ? (
              <CanvasGrid
                rows={rows}
                cols={cols}
                grid={grid}
                onCellClick={handleCellClick}
                coverage={coverage}
                antennaData={optimizationResult?.antennas}
                manualAntennas={manualAntennas}
                antennaSpecs={antennaSpecs}
                largePixels={rows * cols < 100}
                isFullscreen={isFullscreen}
                onExitFullscreen={() => setIsFullscreen(false)}
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
                isFullscreen={isFullscreen}
                onExitFullscreen={() => setIsFullscreen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
