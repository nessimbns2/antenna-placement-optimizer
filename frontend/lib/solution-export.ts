import { AntennaType, OptimizationResponse } from "./api-config";

export interface SolutionData {
  version: string;
  timestamp: string;
  gridSize: {
    rows: number;
    cols: number;
  };
  houses: [number, number][];
  manualAntennas: Array<{
    x: number;
    y: number;
    type: AntennaType;
  }>;
  optimizationResult: OptimizationResponse | null;
  algorithm?: string;
  allowedAntennaTypes?: AntennaType[];
}

/**
 * Export the current solution state to a JSON file
 */
export function exportSolution(
  rows: number,
  cols: number,
  grid: string[][],
  manualAntennas: Map<string, AntennaType>,
  optimizationResult: OptimizationResponse | null,
  algorithm?: string,
  allowedAntennaTypes?: Set<AntennaType>
): void {
  // Extract houses from grid
  const houses: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "house") {
        houses.push([c, r]); // x, y format
      }
    }
  }

  // Convert manual antennas map to array
  const manualAntennasArray = Array.from(manualAntennas.entries()).map(
    ([key, type]) => {
      const [r, c] = key.split(",").map(Number);
      return { x: c, y: r, type }; // Convert row,col to x,y
    }
  );

  const solutionData: SolutionData = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    gridSize: { rows, cols },
    houses,
    manualAntennas: manualAntennasArray,
    optimizationResult,
    algorithm,
    allowedAntennaTypes: allowedAntennaTypes
      ? Array.from(allowedAntennaTypes)
      : undefined,
  };

  // Create and download JSON file
  const jsonString = JSON.stringify(solutionData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `antenna-solution-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Import a solution from a JSON file
 */
export async function importSolution(
  file: File
): Promise<SolutionData | null> {
  try {
    const text = await file.text();
    const data: SolutionData = JSON.parse(text);

    // Validate the data structure
    if (
      !data.version ||
      !data.gridSize ||
      !Array.isArray(data.houses) ||
      !Array.isArray(data.manualAntennas)
    ) {
      throw new Error("Invalid solution file format");
    }

    return data;
  } catch (error) {
    console.error("Error importing solution:", error);
    return null;
  }
}

export interface SolutionStateSetters {
  setRows: (v: number) => void;
  setCols: (v: number) => void;
  setGrid: (g: string[][]) => void;
  setManualAntennas: (m: Map<string, AntennaType>) => void;
  setOptimizationResult: (r: OptimizationResponse | null) => void;
  setAlgorithm?: (a: string) => void;
  setAllowedAntennaTypes?: (types: Set<AntennaType>) => void;
}

/**
 * Apply imported solution data to the application state
 */
export function applySolutionData(
  data: SolutionData,
  setters: SolutionStateSetters
): void {
  const { rows, cols } = data.gridSize;

  // Create empty grid
  const newGrid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    newGrid[r] = new Array(cols).fill("empty");
  }

  // Place houses
  for (const [x, y] of data.houses) {
    if (y >= 0 && y < rows && x >= 0 && x < cols) {
      newGrid[y][x] = "house";
    }
  }

  // Place manual antennas
  const manualAntennasMap = new Map<string, AntennaType>();
  for (const { x, y, type } of data.manualAntennas) {
    if (y >= 0 && y < rows && x >= 0 && x < cols) {
      newGrid[y][x] = "antenna";
      manualAntennasMap.set(`${y},${x}`, type); // Key format: row,col
    }
  }

  // Place optimization result antennas
  if (data.optimizationResult?.antennas) {
    for (const antenna of data.optimizationResult.antennas) {
      if (
        antenna.y >= 0 &&
        antenna.y < rows &&
        antenna.x >= 0 &&
        antenna.x < cols
      ) {
        newGrid[antenna.y][antenna.x] = "antenna";
      }
    }
  }

  // Apply state
  setters.setRows(rows);
  setters.setCols(cols);
  setters.setGrid(newGrid);
  setters.setManualAntennas(manualAntennasMap);
  setters.setOptimizationResult(data.optimizationResult);

  // Apply optional settings
  if (data.algorithm && setters.setAlgorithm) {
    setters.setAlgorithm(data.algorithm);
  }
  if (data.allowedAntennaTypes && setters.setAllowedAntennaTypes) {
    setters.setAllowedAntennaTypes(new Set(data.allowedAntennaTypes));
  }
}
