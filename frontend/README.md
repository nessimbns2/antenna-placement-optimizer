# Cellular Antenna Localization Interface

This is a Next.js application designed to simulate and solve the Cellular Antenna Localization Problem using multiple optimization algorithms.

## Features

- **Interactive Grid Map**: Visualize the problem space with houses (demand points) and antennas.
- **Control Panel**: Configure grid size, antenna radius, and select optimization algorithms.
- **Multiple Algorithms**: Choose from different optimization strategies:
  - **Greedy (Fast)**: Quick approximation using Set Cover approach
  - **Genetic Algorithm**: Evolutionary optimization with population-based search
  - **Simulated Annealing**: Temperature-based probabilistic optimization
  - **Brute Force**: Exhaustive search (limited scope)
- **API-Based Optimization**: Antenna coordinates are calculated server-side via REST API
- **Real-time Stats**: Track coverage percentage, number of antennas, and total cost.
- **Premium UI**: Built with Tailwind CSS, featuring a dark mode glassmorphism design.

## Getting Started

### Prerequisites

- Node.js 18+ for the frontend
- Python 3.8+ for the FastAPI backend
- A running FastAPI server (see [FASTAPI_SPEC.md](./FASTAPI_SPEC.md))

### Frontend Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Configure the API base URL (optional):
    Create a `.env.local` file:
    ```
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

### Backend Setup

The frontend expects a FastAPI backend running on `http://localhost:8000` (configurable).

See [FASTAPI_SPEC.md](./FASTAPI_SPEC.md) for:
- Complete API specification
- Example FastAPI implementation
- Request/Response formats
- CORS configuration

## Usage

1.  **Edit Mode**: Toggle between placing "Houses" or "Antennas" manually.
2.  **Select Algorithm**: Choose your preferred optimization algorithm from the dropdown.
3.  **Randomize**: Generate a random distribution of houses.
4.  **Optimize**: Click "Run Optimizer" to let the selected algorithm place antennas to maximize coverage.
5.  **Clear**: Reset the grid.

## API Integration

The frontend communicates with a **FastAPI backend** for optimization algorithms.

### Endpoint: POST `/api/optimize`

**Base URL**: Configured via `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8000`)

**Full documentation**: See [FASTAPI_SPEC.md](./FASTAPI_SPEC.md)

**Quick Reference:**

Request:
```json
{
  "grid": [["empty", "house", ...], ...],
  "radius": 3,
  "algorithm": "greedy" | "genetic" | "simulated-annealing" | "brute-force"
}
```

Response:
```json
{
  "success": true,
  "algorithm": "greedy",
  "antennas": [{"row": 5, "col": 10}],
  "count": 1
}
```

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- Tailwind CSS v4
- Lucide React (Icons)
- TypeScript

### Backend (External)
- FastAPI (Python)
- Optimization algorithms implementation
- See [FASTAPI_SPEC.md](./FASTAPI_SPEC.md) for details


