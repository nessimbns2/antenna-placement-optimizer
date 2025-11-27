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
    optimization_mode: 'coverage' | 'budget';  // Optimization mode
    target_coverage: number;  // Target user coverage percentage (0-100) - used in coverage mode
    max_budget?: number;  // Maximum budget constraint - used in budget mode
    max_antennas?: number;  // Maximum number of antennas - used in budget mode
    obstacles: [number, number][];  // Houses (x, y coordinates)
    algorithm: string;
    allowed_antenna_types: AntennaType[];
}

export interface OptimizationResponse {
    antennas: AntennaPlacement[];
    coverage_percentage: number;
    users_covered: number;
    total_users: number;
    user_coverage_percentage: number;
    total_capacity: number;
    capacity_utilization: number;
    wasted_capacity: number;
    total_cost: number;
    algorithm: string;
    execution_time_ms: number;
}
