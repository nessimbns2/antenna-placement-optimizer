# Antenna Placement Optimizer

A full-stack application for optimizing cellular antenna placement on a grid using various optimization algorithms.

## 🚀 Overview

This project provides an interactive visualization and optimization tool for the Cellular Antenna Localization Problem. It features a modern Next.js frontend with a powerful FastAPI backend that implements multiple optimization algorithms.

## 📁 Project Structure

```
antenna-placement-optimizer/
├── frontend/          # Next.js application with interactive UI
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   └── lib/          # Utilities and API configuration
│
└── backend/          # FastAPI optimization service
    └── app/          # FastAPI application
        ├── algorithms/   # Optimization algorithms
        ├── models.py     # Pydantic models
        └── main.py       # API endpoints
```

## ✨ Features

### Frontend
- **Interactive Grid Map**: Visualize antenna placement and coverage areas with canvas rendering
- **Grid Seeding**: Auto-generate house patterns (Random, Cluster, Linear, Edge, Diagonal)
- **Dual Edit Modes**: Place houses or manually position antennas
- **Multiple Algorithms**: Choose from Greedy, Genetic, Simulated Annealing, and Brute Force
- **Real-time Stats**: Track coverage percentage, antenna count, and total cost
- **Constraint Controls**: Set budget limits and maximum antenna counts
- **Antenna Type Selection**: Choose which antenna types to allow in optimization
- **Premium UI**: Dark mode glassmorphism design with smooth animations
- **Responsive Design**: Works on desktop and mobile devices

### Backend
- **RESTful API**: Clean, well-documented FastAPI endpoints with Swagger/ReDoc
- **Greedy Algorithm**: Fast, efficient antenna placement optimization
- **Flexible Configuration**: Support for different antenna types (Femto, Pico, Micro, Macro)
- **User Coverage Tracking**: Optimize for both area and user coverage (20 users per house)
- **Budget Constraints**: Support for maximum budget and antenna count limits
- **CORS Enabled**: Ready for cross-origin requests from frontend
- **Production Ready**: Comprehensive error handling, logging, and validation
- **Type Safety**: Full Pydantic model validation for all requests/responses

## 🛠️ Quick Start

### Prerequisites
- **Frontend**: Node.js 18+
- **Backend**: Python 3.9+ and Poetry

### 1. Backend Setup

```bash
cd backend

# Install Poetry (if not already installed)
# Windows PowerShell:
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -

# Install dependencies
poetry install

# Run the server
poetry run python -m app.main
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL (optional)
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Documentation

- **[Frontend README](./frontend/README.md)**: Frontend setup and usage
- **[Backend README](./backend/README.md)**: API documentation and algorithm details
- **[FastAPI Spec](./frontend/FASTAPI_SPEC.md)**: Complete API specification
- **[Environment Setup](./frontend/ENV_SETUP.md)**: Configuration guide

## 🎯 How It Works

1. **Set Grid Size**: Configure grid dimensions (max 1000x1000)
2. **Place Houses**: 
   - Manually click cells to place houses
   - Use Grid Seeding to auto-generate patterns:
     - **Random**: Random distribution across grid
     - **Cluster**: Concentrated groups in specific areas
     - **Linear**: Straight line patterns
     - **Edge**: Houses around grid perimeter
     - **Diagonal**: Diagonal line patterns
3. **Configure Optimization**:
   - Select allowed antenna types
   - Set optional budget limit
   - Set optional maximum antenna count
   - Choose optimization algorithm
4. **Run Optimization**: Backend calculates optimal placements considering:
   - Coverage radius of each antenna type
   - User coverage (20 users per house)
   - Cost efficiency
   - Budget and antenna count limits
5. **View Results**: 
   - Antenna placements visualized on grid
   - Coverage areas shown in real-time
   - Statistics: total cost, coverage %, antenna count, computation time

### Antenna Types

The system supports four antenna types with different characteristics:

| Type  | Coverage Radius | Cost    | Use Case             |
| ----- | --------------- | ------- | -------------------- |
| Femto | 2 units         | $200    | Dense urban areas    |
| Pico  | 5 units         | $2,100  | Indoor/Small outdoor |
| Micro | 15 units        | $6,000  | Urban neighborhoods  |
| Macro | 40 units        | $30,000 | Wide area coverage   |

*Note: 1 grid unit = 50 meters in real-world distance. Each house contains 20 users.*

### Optimization Algorithms

- **Greedy (Implemented)**: Cost-effective placement maximizing users covered per dollar spent
- **Genetic Algorithm**: Evolutionary optimization *(coming soon)*
- **Simulated Annealing**: Temperature-based probabilistic search *(coming soon)*
- **Brute Force**: Exhaustive search for small grids *(coming soon)*

## 🔧 Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS v4
- Lucide React Icons
- clsx & tailwind-merge for styling

### Backend
- FastAPI 0.104+
- Python 3.9+
- Pydantic v2 (data validation)
- NumPy (numerical computations)
- Uvicorn (ASGI server)
- Poetry (dependency management)

## 📊 API Endpoints

### GET /antenna-types
Retrieve available antenna types and their specifications.

```bash
curl "http://localhost:8000/antenna-types"
```

### POST /optimize
Optimize antenna placement based on constraints.

```bash
curl -X POST "http://localhost:8000/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "width": 20,
    "height": 15,
    "obstacles": [[2, 3], [5, 5], [7, 8]],
    "algorithm": "greedy",
    "max_budget": 50000,
    "max_antennas": 10,
    "allowed_antenna_types": ["Pico", "Micro"]
  }'
```

## 🚀 Deployment

### Backend
```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend
```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🎓 Use Cases

- Network planning and optimization
- Educational tool for algorithm visualization
- Research in combinatorial optimization
- Telecommunications infrastructure planning
