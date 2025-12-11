// API Configuration
export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    ENDPOINTS: {
        OPTIMIZE: '/optimize',
        OPTIMIZE_STREAM: '/optimize/stream',
        ANTENNA_TYPES: '/antenna-types',
        HEALTH: '/health'
    }
};

// Type definitions matching backend models
export type AntennaType = 'Macro' | 'Micro' | 'Pico' | 'Femto';

export interface AntennaSpec {
    type: AntennaType;
    radius: number;
    cost: number;
    description: string;
}

export interface AntennaPlacement {
    x: number;
    y: number;
    type: AntennaType;
    radius: number;
    cost: number;
}

export interface OptimizationRequest {
    width: number;
    height: number;
    max_budget?: number;  // Maximum budget constraint (optional)
    max_antennas?: number;  // Maximum number of antennas (optional)
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
    total_cost: number;
    algorithm: string;
    execution_time_ms: number;
}

// Streaming progress update from SSE
export interface OptimizationProgress {
    event_type: 'progress' | 'complete' | 'error';
    iteration: number;
    temperature: number;
    current_energy: number;
    best_energy: number;
    antennas: AntennaPlacement[];
    users_covered: number;
    total_users: number;
    total_cost: number;
    progress_percent: number;
    acceptance_rate: number;
    coverage_percentage?: number;
    user_coverage_percentage?: number;
    detail?: string;  // For error events
}

