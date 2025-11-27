# Antenna Placement Optimizer - AI Agent Guidelines

## Project Architecture

This is a **decoupled full-stack application** for cellular antenna placement optimization:

- **Frontend**: Next.js 16 (App Router) with TypeScript, Tailwind CSS v4, Canvas rendering
- **Backend**: FastAPI with Poetry, Python 3.9+, Pydantic v2 models
- **Communication**: REST API over HTTP (`http://localhost:8000` ↔ `http://localhost:3000`)

**Critical**: Frontend and backend are separate processes. Never attempt to import Python code in TypeScript or vice versa.

## Domain Model & Terminology

### Core Entities

- **Grid**: 2D coordinate system where 1 cell = 50 meters
- **Houses**: User demand points at `(x, y)` coordinates; each contains exactly **20 users**
- **Antennas**: Have `type`, `radius` (Euclidean coverage), `cost`
- **Coverage**: Calculated using **Euclidean distance** (perfect circles), NOT Manhattan/Chebyshev

### Antenna Types (backend/app/models.py)

```python
ANTENNA_SPECS = {
    AntennaType.FEMTO:  AntennaSpec(radius=2,  max_users=20,   cost=200),
    AntennaType.PICO:   AntennaSpec(radius=10, max_users=100,  cost=800),
    AntennaType.MICRO:  AntennaSpec(radius=30, max_users=600,  cost=4200),
    AntennaType.MACRO:  AntennaSpec(radius=80, max_users=2400, cost=14400),
}
```

## Backend Development

### Running the Backend

```bash
cd backend
poetry install
poetry run python -m app.main  # Runs on port 8000
```

### API Contract (backend/app/main.py, frontend/lib/api-config.ts)

**POST /optimize** expects:

```typescript
{
  width: number, height: number,
  obstacles: [number, number][],  // Houses as [x, y] tuples
  algorithm: "greedy" | "genetic" | "simulated-annealing" | "brute-force",
  allowed_antenna_types: AntennaType[],
  max_budget?: number,      // Optional constraint
  max_antennas?: number     // Optional constraint
}
```

Returns:

```typescript
{
  antennas: AntennaPlacement[],  // {x, y, type, radius, cost}
  coverage_percentage: number,   // Area covered
  users_covered: number,         // Out of total_users
  user_coverage_percentage: number,
  total_cost: number,
  execution_time_ms: number
}
```

### Greedy Algorithm (backend/app/algorithms/greedy.py)

- **Score formula**: `new_users / cost`
  - Maximizes cost-effectiveness (users covered per dollar)
- Iteratively selects highest-scoring position/antenna-type combination
- Respects `max_budget` and `max_antennas` constraints
- Antennas **cannot be placed on houses**
- Uses Euclidean distance for coverage calculations

### CORS Configuration (backend/app/config.py)

Default: `http://localhost:3000`. Override via environment variable:

```bash
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
```

## Frontend Development

### Running the Frontend

```bash
cd frontend
npm install
npm run dev  # Runs on port 3000
```

### Environment Variables

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### State Management Pattern (frontend/app/page.tsx)

- **Grid state**: 2D array of `CellType = "empty" | "house" | "antenna" | "covered"`
- **Manual antenna tracking**: `Map<string, AntennaType>` for user-placed antennas (key: `"x,y"`)
- **Optimization result**: Stored separately in `optimizationResult` state
- **Coverage visualization**: Recalculated via `calculateCoverage()` whenever optimization result changes

### Grid Seeding Patterns (frontend/components/grid-seeding-panel.tsx)

Auto-generates house distributions: Random, Cluster (25% density at center), Linear (diagonal), Edge (perimeter), Diagonal (two diagonals).

### Canvas Rendering (frontend/components/canvas-grid.tsx)

Uses **HTML Canvas** for performance on large grids (up to 1000x1000). Dynamically calculates cell size based on viewport. Separate from React grid component (`grid-map.tsx`) which is for smaller grids.

## Development Workflow

### Testing Backend

```bash
# Run test script with different scenarios
poetry run python backend/test_api.py
```

### Adding New Algorithms

1. Create new file in `backend/app/algorithms/`
2. Implement class with `optimize()` → Dict method
3. Register in `backend/app/main.py` optimize endpoint's algorithm router
4. Update `algorithm` type in `frontend/lib/api-config.ts` and form dropdown

### Common Pitfalls

- **Grid coordinates**: Backend uses `(x, y)`, frontend sometimes uses `[row, col]` for arrays (watch indexing)
- **Coverage calculation**: Always use Euclidean distance, not grid distance
- **Antenna placement constraint**: `is_valid_position()` checks for houses
- **User coverage**: Tracks how many users (from houses) are covered by antennas

## Key Files Reference

- `backend/app/main.py` - API endpoints, request routing
- `backend/app/models.py` - Pydantic models, antenna specs
- `backend/app/algorithms/greedy.py` - Score-based optimization
- `frontend/lib/api-config.ts` - API contract types
- `frontend/app/page.tsx` - Main state management, optimization logic
- `frontend/components/canvas-grid.tsx` - Performance-optimized grid renderer

## Conventions

- Backend uses **snake_case**, Frontend uses **camelCase**
- All distances/radii in **grid cells** (1 cell = 50m)
- Always validate grid bounds before placement
- Log optimization steps with emoji indicators (📡, 💰, 👥, 📊)
- Use `logger.info()` for important events, `logger.debug()` for iteration details
