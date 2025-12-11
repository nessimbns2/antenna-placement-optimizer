# Quick Reference: FastAPI Backend

## Required Endpoint

```
POST http://localhost:8000/api/optimize
```

## Request Format

```json
{
  "grid": [
    ["empty", "house", "empty"],
    ["house", "empty", "house"]
  ],
  "radius": 3,
  "algorithm": "greedy"
}
```

**Grid Values**: `"empty"`, `"house"`, `"antenna"`, `"covered"`

**Algorithms**: `"greedy"`, `"genetic"`, `"simulated-annealing"`, `"tabu-search"`, `"hill-climbing"`, `"vns"`

## Response Format

```json
{
  "success": true,
  "algorithm": "greedy",
  "antennas": [
    {"row": 0, "col": 1},
    {"row": 1, "col": 2}
  ],
  "count": 2
}
```

## Minimal FastAPI Server

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AntennaPosition(BaseModel):
    row: int
    col: int

class OptimizeRequest(BaseModel):
    grid: List[List[str]]
    radius: int
    algorithm: str

class OptimizeResponse(BaseModel):
    success: bool
    algorithm: str
    antennas: List[AntennaPosition]
    count: int

@app.post("/api/optimize")
async def optimize(req: OptimizeRequest) -> OptimizeResponse:
    # TODO: Implement your algorithm logic here
    antennas = []  # Your algorithm result
    
    return OptimizeResponse(
        success=True,
        algorithm=req.algorithm,
        antennas=antennas,
        count=len(antennas)
    )
```

## Run Commands

```bash
# Install
pip install fastapi uvicorn pydantic

# Run
uvicorn main:app --reload --port 8000
```

## Test with curl

```bash
curl -X POST http://localhost:8000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "grid": [["empty","house"],["house","empty"]],
    "radius": 2,
    "algorithm": "greedy"
  }'
```

## Frontend Configuration

File: `.env.local`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Full Documentation

- **FASTAPI_SPEC.md** - Complete API specification
- **FASTAPI_INTEGRATION.md** - Integration guide
- **README.md** - User documentation
