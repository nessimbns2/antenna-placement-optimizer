// API Configuration
export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    ENDPOINTS: {
        OPTIMIZE: '/optimize',
        ANTENNA_TYPES: '/antenna-types',
        HEALTH: '/health'
    }
};

// Type definitions matching backend models
export type AntennaType = 'Macro' | 'Micro' | 'Pico' | 'Femto';

export interface AntennaSpec {
    type: AntennaType;
    radius: number;
    max_users: number;
    cost: number;
    description: string;
}

export interface AntennaPlacement {
    x: number;
    y: number;
    type: AntennaType;
    radius: number;
    max_users: number;
    cost: number;
}

export interface OptimizationRequest {
    width: number;
    height: number;
    target_coverage: number;  // Target user coverage percentage (0-100)
    obstacles: [number, number][];  // Houses (x, y coordinates)
    algorithm: string;
}

export interface OptimizationResponse {
    antennas: AntennaPlacement[];
    coverage_percentage: number;
    users_covered: number;
    total_users: number;
    user_coverage_percentage: number;
    total_capacity: number;
    capacity_utilization: number;
    total_cost: number;
    algorithm: string;
    execution_time_ms: number;
}
