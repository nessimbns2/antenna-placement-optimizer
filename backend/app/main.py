from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
import logging
import time
from typing import Dict, AsyncGenerator

from app.config import settings
from app.models import (
    OptimizationRequest,
    OptimizationResponse,
    ErrorResponse,
    AntennaPlacement,
    AntennaType,
    ANTENNA_SPECS
)
from app.algorithms.greedy import GreedyAlgorithm
from app.algorithms.genetic import GeneticAlgorithm
from app.algorithms.simulated_annealing import SimulatedAnnealingAlgorithm

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
                "cost": spec.cost,
                "description": f"Coverage radius: {spec.radius} cells, Cost: ${spec.cost:,}"
            }
            for spec in ANTENNA_SPECS.values()
        ],
        "users_per_house": 20
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
        f"max_budget={request.max_budget}, max_antennas={request.max_antennas}"
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
                antenna_specs=ANTENNA_SPECS,
                houses=request.obstacles,
                allowed_antenna_types=request.allowed_antenna_types,
                max_budget=request.max_budget,
                max_antennas=request.max_antennas
            )
            result = algorithm.optimize()
        elif request.algorithm == "genetic":
            algorithm = GeneticAlgorithm(
                width=request.width,
                height=request.height,
                antenna_specs=ANTENNA_SPECS,
                houses=request.obstacles,
                allowed_antenna_types=request.allowed_antenna_types,
                max_budget=request.max_budget,
                max_antennas=request.max_antennas,
                population_size=30,
                generations=50,
                mutation_rate=0.15,
                crossover_rate=0.7
            )
            result = algorithm.optimize()
        elif request.algorithm == "simulated-annealing":
            algorithm = SimulatedAnnealingAlgorithm(
                width=request.width,
                height=request.height,
                antenna_specs=ANTENNA_SPECS,
                houses=request.obstacles,
                allowed_antenna_types=request.allowed_antenna_types,
                max_budget=request.max_budget,
                max_antennas=request.max_antennas
            )
            result = algorithm.optimize()
        else:
            # Placeholder for other algorithms
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail=f"Algorithm '{request.algorithm}' is not yet implemented. Available: greedy, genetic, simulated-annealing."
            )

        execution_time_ms = (time.time() - start_time) * 1000

        # Create antenna placements with details from result
        antenna_placements = [
            AntennaPlacement(
                x=ant["x"],
                y=ant["y"],
                type=ant["type"],
                radius=ant["radius"],
                cost=ant["cost"]
            )
            for ant in result["antennas"]
        ]

        response = OptimizationResponse(
            antennas=antenna_placements,
            coverage_percentage=round(result["coverage_percentage"], 2),
            users_covered=result["users_covered"],
            total_users=result["total_users"],
            user_coverage_percentage=round(
                result["user_coverage_percentage"], 2),
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


@app.post(
    "/optimize/stream",
    tags=["Optimization"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    }
)
async def optimize_stream(request: OptimizationRequest):
    """
    Stream optimization progress via Server-Sent Events.
    
    Only supports simulated-annealing algorithm for real-time visualization.
    Sends progress updates at each temperature step.
    
    Args:
        request: Optimization request with grid parameters
        
    Returns:
        EventSourceResponse with streaming progress updates
    """
    logger.info(
        f"Received streaming optimization request: algorithm={request.algorithm}, "
        f"grid={request.width}x{request.height}"
    )
    
    # Only simulated-annealing supports streaming
    if request.algorithm != "simulated-annealing":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Streaming only supported for simulated-annealing algorithm"
        )
    
    # Validate houses are within grid bounds
    for obs_x, obs_y in request.obstacles:
        if not (0 <= obs_x < request.width and 0 <= obs_y < request.height):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"House at ({obs_x}, {obs_y}) is outside grid bounds"
            )
    
    async def generate_events() -> AsyncGenerator[dict, None]:
        """Generate SSE events from optimization progress."""
        try:
            algorithm = SimulatedAnnealingAlgorithm(
                width=request.width,
                height=request.height,
                antenna_specs=ANTENNA_SPECS,
                houses=request.obstacles,
                allowed_antenna_types=request.allowed_antenna_types,
                max_budget=request.max_budget,
                max_antennas=request.max_antennas
            )
            
            for progress in algorithm.optimize_streaming():
                # Convert antenna dicts to serializable format
                antennas_data = []
                for ant in progress.get("antennas", []):
                    ant_type = ant.get("type")
                    # Handle both AntennaType enum and string
                    if hasattr(ant_type, 'value'):
                        type_value = ant_type.value
                    else:
                        type_value = str(ant_type)
                    
                    antennas_data.append({
                        "x": ant["x"],
                        "y": ant["y"],
                        "type": type_value,
                        "radius": ant["radius"],
                        "cost": ant["cost"]
                    })
                
                event_data = {
                    "event_type": progress["event_type"],
                    "iteration": progress["iteration"],
                    "temperature": progress["temperature"],
                    "current_energy": progress["current_energy"],
                    "best_energy": progress["best_energy"],
                    "antennas": antennas_data,
                    "users_covered": progress["users_covered"],
                    "total_users": progress["total_users"],
                    "total_cost": progress["total_cost"],
                    "progress_percent": progress["progress_percent"],
                    "acceptance_rate": progress["acceptance_rate"]
                }
                
                # Add extra fields for complete event
                if progress["event_type"] == "complete":
                    event_data["coverage_percentage"] = progress.get("coverage_percentage", 0)
                    event_data["user_coverage_percentage"] = progress.get("user_coverage_percentage", 0)
                
                yield {"data": json.dumps(event_data)}
                
                # Small delay to allow frontend to process and render
                await asyncio.sleep(0.05)  # 50ms between updates
                
        except Exception as e:
            logger.error(f"Streaming optimization failed: {str(e)}", exc_info=True)
            yield {"data": json.dumps({
                "event_type": "error",
                "detail": str(e)
            })}
    
    return EventSourceResponse(generate_events())



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
