"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { GridMap, CellType } from '@/components/grid-map';
import { ControlPanel } from '@/components/control-panel';
import { StatsCard } from '@/components/stats-card';
import { API_CONFIG } from '@/lib/api-config';

const DEFAULT_ROWS = 15;
const DEFAULT_COLS = 20;
const COST_PER_ANTENNA = 5000;

export default function Home() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [radius, setRadius] = useState(3);
  const [editMode, setEditMode] = useState<'house' | 'antenna'>('house');
  const [algorithm, setAlgorithm] = useState<'greedy' | 'genetic' | 'simulated-annealing' | 'brute-force'>('greedy');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Derived state for coverage visualization
  const [coverage, setCoverage] = useState<boolean[][]>([]);

  // Initialize grid
  useEffect(() => {
    setGrid(prev => {
      const newGrid = Array(rows).fill(null).map(() => Array(cols).fill('empty'));
      return newGrid as CellType[][];
    });
  }, [rows, cols]);

  // Calculate coverage
  const calculateCoverage = useCallback((currentGrid: CellType[][], r: number) => {
    const newCoverage = Array(currentGrid.length).fill(null).map(() => Array(currentGrid[0]?.length || 0).fill(false));

    currentGrid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === 'antenna') {
          // Mark covered cells
          for (let i = -r; i <= r; i++) {
            for (let j = -r; j <= r; j++) {
              if (i * i + j * j <= r * r) { // Euclidean distance
                const targetR = rowIndex + i;
                const targetC = colIndex + j;
                if (targetR >= 0 && targetR < currentGrid.length && targetC >= 0 && targetC < currentGrid[0].length) {
                  newCoverage[targetR][targetC] = true;
                }
              }
            }
          }
        }
      });
    });
    return newCoverage;
  }, []);

  useEffect(() => {
    if (grid.length > 0) {
      setCoverage(calculateCoverage(grid, radius));
    }
  }, [grid, radius, calculateCoverage]);

  const handleCellClick = (r: number, c: number) => {
    const newGrid = [...grid.map(row => [...row])];
    const current = newGrid[r][c];

    if (editMode === 'house') {
      newGrid[r][c] = current === 'house' ? 'empty' : 'house';
    } else {
      newGrid[r][c] = current === 'antenna' ? 'empty' : 'antenna';
    }
    setGrid(newGrid);
  };

  const handleRandomize = () => {
    const newGrid = Array(rows).fill(null).map(() => Array(cols).fill('empty'));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.15) { // 15% chance of house
          newGrid[r][c] = 'house';
        }
      }
    }
    setGrid(newGrid as CellType[][]);
  };

  const handleClear = () => {
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill('empty')) as CellType[][]);
  };

  const runOptimization = async () => {
    setIsOptimizing(true);

    try {
      // Clear existing antennas
      let currentGrid: CellType[][] = grid.map(row => row.map(cell => cell === 'antenna' ? 'empty' : cell));
      setGrid(currentGrid);

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Call FastAPI backend
      const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OPTIMIZE}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grid: currentGrid,
          radius,
          algorithm
        })
      });

      if (!response.ok) {
        throw new Error('Optimization failed');
      }

      const data = await response.json();

      // Place antennas with animation
      for (const antenna of data.antennas) {
        currentGrid = currentGrid.map(row => [...row]);
        currentGrid[antenna.row][antenna.col] = 'antenna';
        setGrid(currentGrid);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Optimization error:', error);
      alert('Optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Stats
  const totalHouses = grid.flat().filter(c => c === 'house').length;
  const antennaCount = grid.flat().filter(c => c === 'antenna').length;
  const coveredHousesCount = grid.flat().reduce((acc, cell, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    if (cell === 'house' && coverage[r]?.[c]) return acc + 1;
    return acc;
  }, 0);

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent glow-text">
            Cellular Network Optimizer
          </h1>
          <p className="text-slate-400 text-lg">
            Interactive simulation for optimal antenna placement and coverage analysis.
          </p>
        </div>

        <StatsCard
          totalHouses={totalHouses}
          coveredHouses={coveredHousesCount}
          antennaCount={antennaCount}
          costPerAntenna={COST_PER_ANTENNA}
        />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full overflow-hidden">
            <GridMap
              rows={rows}
              cols={cols}
              grid={grid}
              onCellClick={handleCellClick}
              coverage={coverage}
            />
          </div>

          <ControlPanel
            rows={rows} cols={cols} setRows={setRows} setCols={setCols}
            radius={radius} setRadius={setRadius}
            editMode={editMode} setEditMode={setEditMode}
            algorithm={algorithm} setAlgorithm={setAlgorithm}
            onRandomize={handleRandomize}
            onClear={handleClear}
            onOptimize={runOptimization}
            isOptimizing={isOptimizing}
          />
        </div>
      </div>
    </main>
  );
}

