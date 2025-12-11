/**
 * Pattern generators for creating house distributions.
 * Returns obstacles as [x, y] coordinate arrays.
 */

export type PatternGenerator = (
    size: number,
    density?: number
) => [number, number][];

export interface PatternDefinition {
    name: string;
    label: string;
    fn: PatternGenerator;
}

// Pattern 1: Circular Clusters
export const generateCircularClusters: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const numClusters = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < numClusters; i++) {
        const centerX = Math.floor(Math.random() * size);
        const centerY = Math.floor(Math.random() * size);
        const radius = Math.floor(Math.random() * 8) + 5;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                if (distance <= radius && Math.random() < 0.6) {
                    obstacles.push([x, y]);
                }
            }
        }
    }
    return obstacles;
};

// Pattern 2: Isolated Houses
export const generateIsolatedHouses: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const numHouses = Math.floor(size * size * 0.08);
    const minDistance = 8;
    const placedHouses: { x: number; y: number }[] = [];

    for (let i = 0; i < numHouses; i++) {
        let attempts = 0;
        while (attempts < 50) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            const tooClose = placedHouses.some(
                (house) =>
                    Math.sqrt((x - house.x) ** 2 + (y - house.y) ** 2) < minDistance
            );
            if (!tooClose) {
                obstacles.push([x, y]);
                placedHouses.push({ x, y });
                break;
            }
            attempts++;
        }
    }
    return obstacles;
};

// Pattern 3: Urban Grid
export const generateUrbanGrid: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const blockSize = 6;
    const streetWidth = 2;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const inStreetX = x % (blockSize + streetWidth) < streetWidth;
            const inStreetY = y % (blockSize + streetWidth) < streetWidth;
            if (!inStreetX && !inStreetY && Math.random() < 0.7) {
                obstacles.push([x, y]);
            }
        }
    }
    return obstacles;
};

// Pattern 4: Suburban Spread
export const generateSuburbanSpread: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const density = 0.12;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const clusterX = Math.floor(x / 10);
            const clusterY = Math.floor(y / 10);
            const clusterSeed = (clusterX * 73856093) ^ (clusterY * 19349663);
            const clusterDensity = ((clusterSeed % 100) / 100) * 0.3;
            if (Math.random() < density + clusterDensity) {
                obstacles.push([x, y]);
            }
        }
    }
    return obstacles;
};

// Pattern 5: Linear Streets
export const generateLinearStreets: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const numStreets = Math.floor(Math.random() * 4) + 3;

    for (let i = 0; i < numStreets; i++) {
        const isHorizontal = Math.random() < 0.5;
        const position = Math.floor(Math.random() * size);

        if (isHorizontal) {
            for (let x = 0; x < size; x++) {
                if (Math.random() < 0.5) {
                    if (position > 0) obstacles.push([x, position - 1]);
                    if (position < size - 1) obstacles.push([x, position + 1]);
                }
            }
        } else {
            for (let y = 0; y < size; y++) {
                if (Math.random() < 0.5) {
                    if (position > 0) obstacles.push([position - 1, y]);
                    if (position < size - 1) obstacles.push([position + 1, y]);
                }
            }
        }
    }
    return obstacles;
};

// Pattern 6: Random Scattered
export const generateRandomScattered: PatternGenerator = (size, density) => {
    const obstacles: [number, number][] = [];
    const prob = density ?? (size * size > 50000 ? 0.05 : 0.15);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (Math.random() < prob) {
                obstacles.push([x, y]);
            }
        }
    }
    return obstacles;
};

// Pattern 7: Dense Downtown
export const generateDenseDowntown: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(size / 2);
    const maxRadius = size / 3;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const densityVal = Math.max(0, 1 - distance / maxRadius);
            if (Math.random() < densityVal * 0.9) {
                obstacles.push([x, y]);
            }
        }
    }
    return obstacles;
};

// Pattern 8: Donut Ring
export const generateDonutRing: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(size / 2);
    const outerRadius = size / 3;
    const innerRadius = outerRadius * 0.5;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            if (distance >= innerRadius && distance <= outerRadius && Math.random() < 0.7) {
                obstacles.push([x, y]);
            }
        }
    }
    return obstacles;
};

// Pattern 9: Diagonal Lines
export const generateDiagonalLines: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const numLines = Math.floor(Math.random() * 3) + 4;
    const spacing = size / numLines;

    for (let line = 0; line < numLines; line++) {
        const offset = line * spacing;
        for (let i = 0; i < size; i++) {
            const x = Math.floor(i + offset);
            const y = i;
            if (x >= 0 && x < size && y >= 0 && y < size && Math.random() < 0.6) {
                obstacles.push([x, y]);
                if (Math.random() < 0.4) {
                    if (x + 1 < size) obstacles.push([x + 1, y]);
                    if (x - 1 >= 0) obstacles.push([x - 1, y]);
                }
            }
        }
    }
    return obstacles;
};

// Pattern 10: Coastal Settlement
export const generateCoastalSettlement: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const side = Math.floor(Math.random() * 4);
    const coastDepth = Math.floor(size * 0.3);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let nearCoast = false;
            if (side === 0) nearCoast = y < coastDepth;
            else if (side === 1) nearCoast = x >= size - coastDepth;
            else if (side === 2) nearCoast = y >= size - coastDepth;
            else nearCoast = x < coastDepth;

            if (nearCoast && Math.random() < 0.5) {
                obstacles.push([x, y]);
            }
        }
    }
    return obstacles;
};

// Pattern 11: Mountain Valley
export const generateMountainValley: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const isHorizontal = Math.random() < 0.5;
    const valleyWidth = Math.floor(size * 0.3);
    const valleyCenter = Math.floor(size / 2);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const distFromCenter = isHorizontal
                ? Math.abs(y - valleyCenter)
                : Math.abs(x - valleyCenter);
            if (distFromCenter <= valleyWidth / 2 && Math.random() < 0.6) {
                obstacles.push([x, y]);
            }
        }
    }
    return obstacles;
};

// Pattern 12: Checkerboard
export const generateCheckerboard: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const blockSize = 8;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const blockX = Math.floor(x / blockSize);
            const blockY = Math.floor(y / blockSize);
            const isFilledBlock = (blockX + blockY) % 2 === 0;
            if (isFilledBlock && Math.random() < 0.5) {
                obstacles.push([x, y]);
            }
        }
    }
    return obstacles;
};

// Pattern 13: Riverside Towns
export const generateRiversideTowns: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const isVertical = Math.random() < 0.5;
    const riverPath: number[] = [];

    if (isVertical) {
        let currentX = Math.floor(size / 2);
        for (let y = 0; y < size; y++) {
            riverPath.push(currentX);
            currentX += Math.floor(Math.random() * 3) - 1;
            currentX = Math.max(2, Math.min(size - 3, currentX));
        }
        for (let y = 0; y < size; y++) {
            const riverX = riverPath[y];
            for (let offset = 2; offset <= 5; offset++) {
                if (riverX - offset >= 0 && Math.random() < 0.4)
                    obstacles.push([riverX - offset, y]);
                if (riverX + offset < size && Math.random() < 0.4)
                    obstacles.push([riverX + offset, y]);
            }
        }
    } else {
        let currentY = Math.floor(size / 2);
        for (let x = 0; x < size; x++) {
            riverPath.push(currentY);
            currentY += Math.floor(Math.random() * 3) - 1;
            currentY = Math.max(2, Math.min(size - 3, currentY));
        }
        for (let x = 0; x < size; x++) {
            const riverY = riverPath[x];
            for (let offset = 2; offset <= 5; offset++) {
                if (riverY - offset >= 0 && Math.random() < 0.4)
                    obstacles.push([x, riverY - offset]);
                if (riverY + offset < size && Math.random() < 0.4)
                    obstacles.push([x, riverY + offset]);
            }
        }
    }
    return obstacles;
};

// Pattern 14: Highway Network
export const generateHighwayNetwork: PatternGenerator = (size) => {
    const obstacles: [number, number][] = [];
    const numHighways = Math.floor(Math.random() * 2) + 2;

    for (let i = 0; i < numHighways; i++) {
        const isHorizontal = i % 2 === 0;
        const position = Math.floor(((i + 1) * size) / (numHighways + 1));

        if (isHorizontal) {
            for (let x = 0; x < size; x++) {
                if (x % 15 === 0) {
                    for (let dy = -3; dy <= 3; dy++) {
                        for (let dx = -3; dx <= 3; dx++) {
                            const ny = position + dy;
                            const nx = x + dx;
                            if (ny >= 0 && ny < size && nx >= 0 && nx < size && Math.random() < 0.6) {
                                obstacles.push([nx, ny]);
                            }
                        }
                    }
                }
            }
        } else {
            for (let y = 0; y < size; y++) {
                if (y % 15 === 0) {
                    for (let dy = -3; dy <= 3; dy++) {
                        for (let dx = -3; dx <= 3; dx++) {
                            const ny = y + dy;
                            const nx = position + dx;
                            if (ny >= 0 && ny < size && nx >= 0 && nx < size && Math.random() < 0.6) {
                                obstacles.push([nx, ny]);
                            }
                        }
                    }
                }
            }
        }
    }
    return obstacles;
};

// All patterns with metadata
export const PATTERNS: PatternDefinition[] = [
    { name: "random", label: "🎲 Random Pattern", fn: generateRandomScattered },
    { name: "circular_clusters", label: "🔵 Circular Clusters", fn: generateCircularClusters },
    { name: "isolated_houses", label: "🏠 Isolated Houses", fn: generateIsolatedHouses },
    { name: "urban_grid", label: "🏙️ Urban Grid", fn: generateUrbanGrid },
    { name: "suburban_spread", label: "🏡 Suburban Spread", fn: generateSuburbanSpread },
    { name: "linear_streets", label: "🛣️ Linear Streets", fn: generateLinearStreets },
    { name: "dense_downtown", label: "🌆 Dense Downtown", fn: generateDenseDowntown },
    { name: "donut_ring", label: "🍩 Donut Ring", fn: generateDonutRing },
    { name: "diagonal_lines", label: "⚡ Diagonal Lines", fn: generateDiagonalLines },
    { name: "coastal_settlement", label: "🏖️ Coastal Settlement", fn: generateCoastalSettlement },
    { name: "mountain_valley", label: "⛰️ Mountain Valley", fn: generateMountainValley },
    { name: "checkerboard", label: "♟️ Checkerboard", fn: generateCheckerboard },
    { name: "riverside_towns", label: "🌊 Riverside Towns", fn: generateRiversideTowns },
    { name: "highway_network", label: "🛤️ Highway Network", fn: generateHighwayNetwork },
];

// Helper to get unique obstacles (removes duplicates)
export function deduplicateObstacles(
    obstacles: [number, number][]
): [number, number][] {
    const seen = new Set<string>();
    return obstacles.filter(([x, y]) => {
        const key = `${x},${y}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Generate obstacles using a pattern by name
export function generateObstacles(
    patternName: string,
    size: number,
    density?: number
): [number, number][] {
    const pattern = PATTERNS.find((p) => p.name === patternName);
    if (!pattern) {
        return generateRandomScattered(size, density);
    }
    return deduplicateObstacles(pattern.fn(size, density));
}
