from pydantic import BaseModel, Field, field_validator
from typing import List, Tuple, Dict, Optional
from enum import Enum


class AntennaType(str, Enum):
    """Antenna types with different specifications."""
    SMALL = "small"      # Radius: 2, Max users: 50
    MEDIUM = "medium"    # Radius: 3, Max users: 100
    LARGE = "large"      # Radius: 4, Max users: 200


class AntennaSpec(BaseModel):
    """Antenna specifications."""
    type: AntennaType
    radius: int
    max_users: int


# Predefined antenna specifications
ANTENNA_SPECS: Dict[AntennaType, AntennaSpec] = {
    AntennaType.SMALL: AntennaSpec(type=AntennaType.SMALL, radius=2, max_users=50),
    AntennaType.MEDIUM: AntennaSpec(type=AntennaType.MEDIUM, radius=3, max_users=100),
    AntennaType.LARGE: AntennaSpec(type=AntennaType.LARGE, radius=4, max_users=200),
}

USERS_PER_HOUSE = 10  # Each house contains 10 users


class OptimizationRequest(BaseModel):
    """Request model for antenna placement optimization."""
    
    width: int = Field(..., gt=0, description="Grid width")
    height: int = Field(..., gt=0, description="Grid height")
    num_antennas: int = Field(..., gt=0, description="Number of antennas to place")
    antenna_type: AntennaType = Field(
        default=AntennaType.MEDIUM,
        description="Type of antenna: small (r=2, 50 users), medium (r=3, 100 users), large (r=4, 200 users)"
    )
    obstacles: List[Tuple[int, int]] = Field(
        default_factory=list,
        description="List of house coordinates (x, y) - each house has 10 users. Antennas cannot be placed on houses."
    )
    algorithm: str = Field(
        default="greedy",
        description="Algorithm to use: greedy, genetic, simulated-annealing, brute-force"
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
                raise ValueError("Each house/obstacle must be a tuple of (x, y)")
            if not isinstance(obstacle[0], int) or not isinstance(obstacle[1], int):
                raise ValueError("House/obstacle coordinates must be integers")
        return v


class AntennaPlacement(BaseModel):
    """Individual antenna placement details."""
    x: int = Field(..., description="X coordinate")
    y: int = Field(..., description="Y coordinate")
    type: AntennaType = Field(..., description="Antenna type")
    radius: int = Field(..., description="Coverage radius")
    max_users: int = Field(..., description="Maximum users this antenna can serve")


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
        le=100,
        description="Percentage of antenna capacity being used"
    )
    algorithm: str = Field(..., description="Algorithm used for optimization")
    execution_time_ms: float = Field(..., description="Execution time in milliseconds")
    
    @property
    def antenna_coordinates(self) -> List[Tuple[int, int]]:
        """Get simple list of antenna coordinates for backward compatibility."""
        return [(a.x, a.y) for a in self.antennas]


class ErrorResponse(BaseModel):
    """Error response model."""
    
    detail: str = Field(..., description="Error message")
    error_type: str = Field(..., description="Type of error")
