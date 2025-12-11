# FastAPI Backend Specification

## Overview
The Next.js frontend expects a FastAPI backend running on `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_BASE_URL` environment variable).

## Required Endpoint

### POST `/api/optimize`

Calculates optimal antenna placements using the specified algorithm.

#### Request Body
```json
{
  "grid": [
    ["empty", "house", "empty", ...],
    ["empty", "empty", "house", ...],
    ...
  ],
  "radius": 3,
  "algorithm": "greedy" | "genetic" | "simulated-annealing" | "tabu-search" | "hill-climbing" | "vns"
}
```

**Field Descriptions:**
- `grid`: 2D array representing the grid state
  - Possible values: `"empty"`, `"house"`, `"antenna"`, `"covered"`
  - Note: Antennas are cleared before sending, so you'll only see `"empty"` and `"house"`
- `radius`: Coverage radius for each antenna (in grid cells)
- `algorithm`: Selected optimization algorithm

#### Response Body
```json
{
  "success": true,
  "algorithm": "greedy",
  "antennas": [
    { "row": 5, "col": 10 },
    { "row": 8, "col": 15 }
  ],
  "count": 2
}
```

**Field Descriptions:**
- `success`: Boolean indicating if optimization succeeded
- `algorithm`: Echo of the algorithm used
- `antennas`: Array of antenna positions
  - `row`: 0-indexed row position
  - `col`: 0-indexed column position
- `count`: Total number of antennas placed

#### Error Response
```json
{
  "error": "Error message description"
}
```
Status code: 400 (Bad Request) or 500 (Internal Server Error)

## Example FastAPI Implementation

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal

app = FastAPI(title="Antenna Optimization API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AntennaPosition(BaseModel):
    row: int
    col: int

class OptimizeRequest(BaseModel):
    grid: List[List[str]]
    radius: int
    algorithm: Literal["greedy", "genetic", "simulated-annealing", "tabu-search", "hill-climbing", "vns"]

class OptimizeResponse(BaseModel):
    success: bool
    algorithm: str
    antennas: List[AntennaPosition]
    count: int

@app.post("/api/optimize", response_model=OptimizeResponse)
async def optimize(request: OptimizeRequest):
    try:
        # Your algorithm implementation here
        antennas = []
        
        if request.algorithm == "greedy":
            antennas = greedy_algorithm(request.grid, request.radius)
        elif request.algorithm == "genetic":
            antennas = genetic_algorithm(request.grid, request.radius)
        elif request.algorithm == "simulated-annealing":
            antennas = simulated_annealing(request.grid, request.radius)
        elif request.algorithm == "tabu-search":
            antennas = tabu_search(request.grid, request.radius)
        elif request.algorithm == "hill-climbing":
            antennas = hill_climbing(request.grid, request.radius)
        elif request.algorithm == "vns":
            antennas = vns_algorithm(request.grid, request.radius)
        
        return OptimizeResponse(
            success=True,
            algorithm=request.algorithm,
            antennas=antennas,
            count=len(antennas)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Implement your algorithms here
def greedy_algorithm(grid: List[List[str]], radius: int) -> List[AntennaPosition]:
    # Your greedy implementation
    pass

def genetic_algorithm(grid: List[List[str]], radius: int) -> List[AntennaPosition]:
    # Your genetic algorithm implementation
    pass

def simulated_annealing(grid: List[List[str]], radius: int) -> List[AntennaPosition]:
    # Your simulated annealing implementation
    pass

def tabu_search(grid: List[List[str]], radius: int) -> List[AntennaPosition]:
    # Your tabu search implementation
    pass

def hill_climbing(grid: List[List[str]], radius: int) -> List[AntennaPosition]:
    # Your hill climbing implementation
    pass

def vns_algorithm(grid: List[List[str]], radius: int) -> List[AntennaPosition]:
    # Your VNS implementation
    pass
```

## Running the Backend

```bash
# Install dependencies
pip install fastapi uvicorn pydantic

# Run the server
uvicorn main:app --reload --port 8000
```

## Configuration

To change the backend URL, set the environment variable in your Next.js project:

Create a `.env.local` file:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Or for production:
```
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

## CORS Configuration

Make sure your FastAPI backend allows requests from your Next.js frontend origin:
- Development: `http://localhost:3000`
- Production: Your deployed frontend URL

## Testing the API

You can test the endpoint using curl:

```bash
curl -X POST http://localhost:8000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "grid": [
      ["empty", "house", "empty"],
      ["empty", "empty", "house"],
      ["house", "empty", "empty"]
    ],
    "radius": 2,
    "algorithm": "greedy"
  }'
```

Expected response:
```json
{
  "success": true,
  "algorithm": "greedy",
  "antennas": [
    {"row": 1, "col": 1}
  ],
  "count": 1
}
```
