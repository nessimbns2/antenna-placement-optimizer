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
- **Interactive Grid Map**: Visualize antenna placement and coverage areas
- **Multiple Algorithms**: Choose from Greedy, Genetic, Simulated Annealing, and Brute Force
- **Real-time Stats**: Track coverage percentage, antenna count, and capacity utilization
- **Premium UI**: Dark mode glassmorphism design with smooth animations
- **Responsive Design**: Works on desktop and mobile devices

### Backend
- **RESTful API**: Clean, well-documented FastAPI endpoints
- **Greedy Algorithm**: Fast, efficient antenna placement optimization
- **Flexible Configuration**: Support for different antenna types (small, medium, large)
- **User Coverage Tracking**: Optimize for both area and user coverage
- **Production Ready**: Comprehensive error handling and logging

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

1. **Define the Problem**: Set grid dimensions and place houses (demand points)
2. **Choose Algorithm**: Select from multiple optimization strategies
3. **Optimize**: The backend calculates optimal antenna placements
4. **Visualize**: See coverage areas and performance metrics in real-time

### Optimization Algorithms

- **Greedy (Fast)**: Quick approximation prioritizing user coverage
- **Genetic Algorithm**: Evolutionary optimization *(coming soon)*
- **Simulated Annealing**: Temperature-based probabilistic search *(coming soon)*
- **Brute Force**: Exhaustive search for small grids *(coming soon)*

## 🔧 Tech Stack

### Frontend
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Lucide React Icons

### Backend
- FastAPI
- Python 3.9+
- Pydantic
- Poetry

## 📊 API Example

```bash
curl -X POST "http://localhost:8000/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "width": 10,
    "height": 10,
    "num_antennas": 3,
    "antenna_type": "medium",
    "obstacles": [[2, 3], [5, 5], [7, 8]],
    "algorithm": "greedy"
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
