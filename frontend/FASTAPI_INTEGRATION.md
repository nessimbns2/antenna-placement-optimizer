# FastAPI Backend Integration - Summary

## ✅ What Was Done

The Next.js frontend has been **reconfigured to use an external FastAPI backend** for all optimization algorithms.

### Changes Made:

1. **Removed Next.js API Route**
   - Deleted `/app/api/optimize/` directory
   - No server-side logic in Next.js anymore

2. **Added API Configuration**
   - Created `lib/api-config.ts` with configurable base URL
   - Environment variable: `NEXT_PUBLIC_API_BASE_URL`
   - Default: `http://localhost:8000`

3. **Updated Frontend**
   - Modified `app/page.tsx` to call external API
   - Full URL: `http://localhost:8000/api/optimize`
   - Sends: grid, radius, algorithm
   - Receives: antenna coordinates

4. **Created Documentation**
   - `FASTAPI_SPEC.md`: Complete API specification
   - `ENV_SETUP.md`: Environment configuration guide
   - Updated `README.md` with backend setup instructions

5. **Environment Setup**
   - Created `.env.local` with default configuration

## 📋 What You Need to Do

### Implement the FastAPI Backend

Create a Python FastAPI server with this endpoint:

**Endpoint**: `POST /api/optimize`

**Request**:
```json
{
  "grid": [["empty", "house", ...], ...],
  "radius": 3,
  "algorithm": "greedy" | "genetic" | "simulated-annealing" | "tabu-search" | "hill-climbing" | "vns"
}
```

**Response**:
```json
{
  "success": true,
  "algorithm": "greedy",
  "antennas": [{"row": 5, "col": 10}],
  "count": 1
}
```

### Quick Start Template

See `FASTAPI_SPEC.md` for a complete example, or use this minimal template:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal

app = FastAPI()

# Enable CORS
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
    algorithm: Literal["greedy", "genetic", "simulated-annealing", "tabu-search", "hill-climbing", "vns"]

class OptimizeResponse(BaseModel):
    success: bool
    algorithm: str
    antennas: List[AntennaPosition]
    count: int

@app.post("/api/optimize")
async def optimize(request: OptimizeRequest) -> OptimizeResponse:
    # Implement your algorithms here
    antennas = your_algorithm(request.grid, request.radius, request.algorithm)
    
    return OptimizeResponse(
        success=True,
        algorithm=request.algorithm,
        antennas=antennas,
        count=len(antennas)
    )
```

### Run the Backend

```bash
# Install FastAPI
pip install fastapi uvicorn pydantic

# Run the server
uvicorn main:app --reload --port 8000
```

## 🧪 Testing

1. **Start FastAPI backend** on port 8000
2. **Start Next.js frontend**: `npm run dev`
3. **Open** http://localhost:3000
4. **Click** "Randomize" to add houses
5. **Select** an algorithm
6. **Click** "Run Optimizer"
7. **Watch** antennas appear via API

## 📁 File Structure

```
complexity/
├── app/
│   └── page.tsx              # Updated to call FastAPI
├── lib/
│   └── api-config.ts         # API configuration
├── .env.local                # Environment variables
├── FASTAPI_SPEC.md          # Complete API specification
├── ENV_SETUP.md             # Environment setup guide
└── README.md                # Updated documentation
```

## 🔧 Configuration

To change the backend URL:

```bash
# Edit .env.local
NEXT_PUBLIC_API_BASE_URL=http://your-api-server:8000
```

## ⚠️ Important Notes

1. **CORS**: Your FastAPI backend must allow requests from `http://localhost:3000`
2. **Port**: Default is 8000, but configurable via environment variable
3. **Algorithms**: You need to implement all 4 algorithms in your FastAPI backend
4. **Grid Format**: Grid cells are strings: "empty", "house", "antenna", "covered"

## 📚 Documentation Files

- **FASTAPI_SPEC.md**: Full API specification with example implementation
- **ENV_SETUP.md**: How to configure environment variables
- **IMPLEMENTATION.md**: Technical implementation details
- **README.md**: Updated user guide

---

**Next Step**: Implement your FastAPI backend using the specification in `FASTAPI_SPEC.md`
