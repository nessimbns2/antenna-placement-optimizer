from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
from typing import Dict

from app.config import settings
from app.models import (
    OptimizationRequest, 
    OptimizationResponse, 
    ErrorResponse,
    AntennaPlacement,
    ANTENNA_SPECS
)
from app.algorithms.greedy import GreedyAlgorithm

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Antenna Placement Optimization API",
    description="FastAPI backend for optimizing antenna placement on a grid",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS enabled for origins: {settings.cors_origins_list}")


@app.get("/", tags=["Health"])
async def root() -> Dict[str, str]:
    """Root endpoint to check API status."""
    return {
        "message": "Antenna Placement Optimization API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/antenna-types", tags=["Configuration"])
async def get_antenna_types():
    """Get available antenna types and their specifications."""
    return {
        "antenna_types": [
            {
                "type": spec.type.value,
                "radius": spec.radius,
                "max_users": spec.max_users,
                "cost": spec.cost,
                "description": f"Coverage radius: {spec.radius}, Max users: {spec.max_users}, Cost: ${spec.cost}"
            }
            for spec in ANTENNA_SPECS.values()
        ],
        "users_per_house": 10
    }


@app.post(
    "/optimize",
    response_model=OptimizationResponse,
    status_code=status.HTTP_200_OK,
    tags=["Optimization"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    }
)
async def optimize_antenna_placement(request: OptimizationRequest) -> OptimizationResponse:
    """
    Optimize antenna placement on a grid.
    
    Args:
        request: Optimization request with grid parameters
        
    Returns:
        Optimization response with antenna positions and coverage
        
    Raises:
        HTTPException: If optimization fails
    """
    start_time = time.time()
    
    logger.info(
        f"Received optimization request: algorithm={request.algorithm}, "
        f"grid={request.width}x{request.height}, "
        f"target_coverage={request.target_coverage}%"
    )
    
    try:
        # Check if houses are within grid bounds
        for obs_x, obs_y in request.obstacles:
            if not (0 <= obs_x < request.width and 0 <= obs_y < request.height):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"House at ({obs_x}, {obs_y}) is outside grid bounds"
                )
        
        # Route to appropriate algorithm
        if request.algorithm == "greedy":
            algorithm = GreedyAlgorithm(
                width=request.width,
                height=request.height,
                target_coverage=request.target_coverage,
                antenna_specs=ANTENNA_SPECS,
                houses=request.obstacles
            )
            result = algorithm.optimize()
        else:
            # Placeholder for other algorithms
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail=f"Algorithm '{request.algorithm}' is not yet implemented. Currently only 'greedy' is available."
            )
        
        execution_time_ms = (time.time() - start_time) * 1000
        
        # Create antenna placements with details from result
        antenna_placements = [
            AntennaPlacement(
                x=ant["x"],
                y=ant["y"],
                type=ant["type"],
                radius=ant["radius"],
                max_users=ant["max_users"],
                cost=ant["cost"]
            )
            for ant in result["antennas"]
        ]
        
        response = OptimizationResponse(
            antennas=antenna_placements,
            coverage_percentage=round(result["coverage_percentage"], 2),
            users_covered=result["users_covered"],
            total_users=result["total_users"],
            user_coverage_percentage=round(result["user_coverage_percentage"], 2),
            total_capacity=result["total_capacity"],
            capacity_utilization=round(result["capacity_utilization"], 2),
            total_cost=result["total_cost"],
            algorithm=request.algorithm,
            execution_time_ms=round(execution_time_ms, 2)
        )
        
        logger.info(
            f"Optimization complete: {len(antenna_placements)} antennas, "
            f"${result['total_cost']} total cost, "
            f"{result['coverage_percentage']:.2f}% area coverage, "
            f"{result['users_covered']}/{result['total_users']} users ({result['user_coverage_percentage']:.2f}%), "
            f"{execution_time_ms:.2f}ms"
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Optimization failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization failed: {str(e)}"
        )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred",
            "error_type": type(exc).__name__
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting server on {settings.host}:{settings.port}")
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower()
    )
