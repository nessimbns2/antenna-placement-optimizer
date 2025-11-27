from pydantic import BaseModel, Field, field_validator
from typing import List, Tuple, Dict, Optional
from enum import Enum


class AntennaType(str, Enum):
    """Antenna types with different specifications."""
    FEMTO = "Femto"    # Radius: 2, Max users: 20, Cost: $200
    PICO = "Pico"      # Radius: 10, Max users: 100, Cost: $800
    MICRO = "Micro"    # Radius: 30, Max users: 600, Cost: $4,200
    MACRO = "Macro"    # Radius: 80, Max users: 2400, Cost: $14,400


class OptimizationMode(str, Enum):
    """Optimization mode determines how the algorithm optimizes."""
    COVERAGE = "coverage"  # Optimize for target coverage with minimum cost
    BUDGET = "budget"      # Maximize coverage within budget/antenna constraints


class AntennaSpec(BaseModel):
    """Antenna specifications."""
    type: AntennaType
    radius: int
    max_users: int
    cost: int


# Predefined antenna specifications with costs
# Based on grid system where 1 square = 50 meters
ANTENNA_SPECS: Dict[AntennaType, AntennaSpec] = {
    AntennaType.FEMTO: AntennaSpec(type=AntennaType.FEMTO, radius=2, max_users=20, cost=200),
    AntennaType.PICO: AntennaSpec(type=AntennaType.PICO, radius=10, max_users=100, cost=800),
    AntennaType.MICRO: AntennaSpec(type=AntennaType.MICRO, radius=30, max_users=600, cost=4200),
    AntennaType.MACRO: AntennaSpec(type=AntennaType.MACRO, radius=80, max_users=2400, cost=14400),
}

USERS_PER_HOUSE = 20  # Each house contains 20 users


class OptimizationRequest(BaseModel):
    """Request model for antenna placement optimization."""

    width: int = Field(..., gt=0, description="Grid width")
    height: int = Field(..., gt=0, description="Grid height")
    optimization_mode: OptimizationMode = Field(
        default=OptimizationMode.COVERAGE,
        description="Optimization mode: 'coverage' for target coverage with minimum cost, 'budget' for maximum coverage within constraints"
    )
    target_coverage: float = Field(
        default=95.0,
        ge=0,
        le=100,
        description="Target user coverage percentage (0-100). Used when optimization_mode='coverage'."
    )
    max_budget: Optional[int] = Field(
        default=None,
        gt=0,
        description="Maximum budget constraint in dollars. Used when optimization_mode='budget'."
    )
    max_antennas: Optional[int] = Field(
        default=None,
        gt=0,
        description="Maximum number of antennas constraint. Used when optimization_mode='budget'."
    )
    obstacles: List[Tuple[int, int]] = Field(
        default_factory=list,
        description="List of house coordinates (x, y) - each house has 10 users. Antennas cannot be placed on houses."
    )
    algorithm: str = Field(
        default="greedy",
        description="Algorithm to use: greedy, genetic, simulated-annealing, brute-force"
    )
    allowed_antenna_types: List[AntennaType] = Field(
        default_factory=lambda: [
            AntennaType.FEMTO, AntennaType.PICO, AntennaType.MICRO, AntennaType.MACRO],
        description="List of allowed antenna types for optimization"
    )

    @field_validator("algorithm")
    @classmethod
    def validate_algorithm(cls, v: str) -> str:
        """Validate algorithm name."""
        allowed = ["greedy", "genetic", "simulated-annealing", "brute-force"]
        if v.lower() not in allowed:
            raise ValueError(f"Algorithm must be one of: {', '.join(allowed)}")
        return v.lower()

    @field_validator("obstacles")
    @classmethod
    def validate_obstacles(cls, v: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
        """Validate house/obstacle coordinates."""
        for obstacle in v:
            if len(obstacle) != 2:
                raise ValueError(
                    "Each house/obstacle must be a tuple of (x, y)")
            if not isinstance(obstacle[0], int) or not isinstance(obstacle[1], int):
                raise ValueError("House/obstacle coordinates must be integers")
        return v


class AntennaPlacement(BaseModel):
    """Individual antenna placement details."""
    x: int = Field(..., description="X coordinate")
    y: int = Field(..., description="Y coordinate")
    type: AntennaType = Field(..., description="Antenna type")
    radius: int = Field(..., description="Coverage radius")
    max_users: int = Field(...,
                           description="Maximum users this antenna can serve")
    cost: int = Field(..., description="Cost of this antenna")


class OptimizationResponse(BaseModel):
    """Response model for antenna placement optimization."""

    antennas: List[AntennaPlacement] = Field(
        ...,
        description="List of antenna placements with details"
    )
    coverage_percentage: float = Field(
        ...,
        ge=0,
        le=100,
        description="Percentage of grid area covered by antennas"
    )
    users_covered: int = Field(
        ...,
        ge=0,
        description="Total number of users covered (from houses within antenna range)"
    )
    total_users: int = Field(
        ...,
        ge=0,
        description="Total number of users in all houses"
    )
    user_coverage_percentage: float = Field(
        ...,
        ge=0,
        le=100,
        description="Percentage of users covered"
    )
    total_capacity: int = Field(
        ...,
        ge=0,
        description="Total user capacity of all placed antennas"
    )
    capacity_utilization: float = Field(
        ...,
        ge=0,
        description="Percentage of antenna capacity being used (can exceed 100% if demand exceeds capacity)"
    )
    wasted_capacity: int = Field(
        ...,
        ge=0,
        description="Unused capacity (total_capacity - users_covered)"
    )
    total_cost: int = Field(
        ...,
        ge=0,
        description="Total cost of all placed antennas"
    )
    algorithm: str = Field(..., description="Algorithm used for optimization")
    execution_time_ms: float = Field(...,
                                     description="Execution time in milliseconds")

    @property
    def antenna_coordinates(self) -> List[Tuple[int, int]]:
        """Get simple list of antenna coordinates for backward compatibility."""
        return [(a.x, a.y) for a in self.antennas]


class ErrorResponse(BaseModel):
    """Error response model."""

    detail: str = Field(..., description="Error message")
    error_type: str = Field(..., description="Type of error")
