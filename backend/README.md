# Antenna Placement Optimization API

A production-ready FastAPI backend for optimizing antenna placement on a grid using various optimization algorithms.

## 🚀 Features

- **Greedy Algorithm**: Efficient antenna placement optimization
- **RESTful API**: Clean and well-documented endpoints
- **CORS Support**: Pre-configured for frontend integration
- **Error Handling**: Comprehensive error handling and validation
- **Logging**: Detailed logging for debugging and monitoring
- **Type Safety**: Full type hints with Pydantic models
- **Production Ready**: Structured for scalability and maintenance

## 📋 Requirements

- Python 3.9+
- Poetry (for dependency management)

## 🛠️ Setup Instructions

### 1. Install Poetry

If you don't have Poetry installed:

```powershell
# Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
```

### 2. Clone and Install Dependencies

```powershell
# Navigate to the project directory
cd "c:\Users\nessi\OneDrive\Desktop\complexity backend"

# Install dependencies
poetry install
```

### 3. Configure Environment

The `.env` file is already configured with defaults:

```
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
```

You can modify these values if needed.

### 4. Run the Server

```powershell
# Start the development server
poetry run python -m app.main
```

Alternatively:

```powershell
# Activate the virtual environment
poetry shell

# Run the server
python -m app.main
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📡 API Endpoints

### Health Check

```http
GET /
GET /health
```

Check if the API is running.

**Response:**
```json
{
  "status": "healthy"
}
```

### Get Antenna Types

```http
GET /antenna-types
```

Get available antenna types and their specifications.

**Response:**
```json
{
  "antenna_types": [
    {
      "type": "small",
      "radius": 2,
      "max_users": 50,
      "description": "Coverage radius: 2, Max users: 50"
    },
    {
      "type": "medium",
      "radius": 3,
      "max_users": 100,
      "description": "Coverage radius: 3, Max users: 100"
    },
    {
      "type": "large",
      "radius": 4,
      "max_users": 200,
      "description": "Coverage radius: 4, Max users: 200"
    }
  ],
  "users_per_house": 10
}
```

### Optimize Antenna Placement

```http
POST /optimize
```

Optimize antenna placement on a grid with houses containing users.

**Request Body:**
```json
{
  "width": 10,
  "height": 10,
  "num_antennas": 3,
  "antenna_type": "medium",
  "obstacles": [[2, 3], [5, 5], [7, 8]],
  "algorithm": "greedy"
}
```

**Parameters:**
- `width` (integer, required): Grid width (> 0)
- `height` (integer, required): Grid height (> 0)
- `num_antennas` (integer, required): Number of antennas to place (> 0)
- `antenna_type` (string, optional): Type of antenna (default: "medium")
  - `"small"`: radius=2, max_users=50
  - `"medium"`: radius=3, max_users=100
  - `"large"`: radius=4, max_users=200
- `obstacles` (array, optional): List of house coordinates `[x, y]`. Each house contains 10 users. Antennas cannot be placed on houses.
- `algorithm` (string, optional): Algorithm to use (default: "greedy")
  - Available: `"greedy"` (more algorithms coming soon)

**Response:**
```json
{
  "antennas": [
    {
      "x": 4,
      "y": 5,
      "type": "medium",
      "radius": 3,
      "max_users": 100
    },
    {
      "x": 1,
      "y": 2,
      "type": "medium",
      "radius": 3,
      "max_users": 100
    }
  ],
  "coverage_percentage": 75.5,
  "users_covered": 30,
  "total_users": 30,
  "user_coverage_percentage": 100.0,
  "total_capacity": 200,
  "capacity_utilization": 15.0,
  "algorithm": "greedy",
  "execution_time_ms": 12.34
}
```

**Response Fields:**
- `antennas`: List of antenna placements with details (x, y, type, radius, max_users)
- `coverage_percentage`: Percentage of grid area covered (0-100)
- `users_covered`: Number of users in houses covered by antennas
- `total_users`: Total number of users in all houses (houses × 10)
- `user_coverage_percentage`: Percentage of users covered (0-100)
- `total_capacity`: Total user capacity of all placed antennas
- `capacity_utilization`: Percentage of antenna capacity being used (0-100)
- `algorithm`: Algorithm used
- `execution_time_ms`: Execution time in milliseconds

## 🧪 Example Usage

### Using curl

```powershell
curl -X POST "http://localhost:8000/optimize" `
  -H "Content-Type: application/json" `
  -d '{
    "width": 10,
    "height": 10,
    "num_antennas": 3,
    "antenna_type": "medium",
    "obstacles": [[2, 3], [5, 5], [7, 8]],
    "algorithm": "greedy"
  }'
```

### Using Python

```python
import requests

url = "http://localhost:8000/optimize"
data = {
    "width": 10,
    "height": 10,
    "num_antennas": 3,
    "antenna_type": "medium",
    "obstacles": [[2, 3], [5, 5], [7, 8]],  # Houses with 10 users each
    "algorithm": "greedy"
}

response = requests.post(url, json=data)
result = response.json()

print(f"Antennas placed: {len(result['antennas'])}")
print(f"Area coverage: {result['coverage_percentage']}%")
print(f"Users covered: {result['users_covered']}/{result['total_users']} ({result['user_coverage_percentage']}%)")
print(f"Capacity utilization: {result['capacity_utilization']}%")
print(f"Execution time: {result['execution_time_ms']}ms")
```

### Using JavaScript (Fetch)

```javascript
const response = await fetch('http://localhost:8000/optimize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    width: 10,
    height: 10,
    num_antennas: 3,
    antenna_type: 'medium',
    obstacles: [[2, 3], [5, 5], [7, 8]],  // Houses with 10 users each
    algorithm: 'greedy'
  })
});

const result = await response.json();
console.log('Antennas:', result.antennas);
console.log('Area coverage:', result.coverage_percentage + '%');
console.log('Users covered:', result.users_covered + '/' + result.total_users);
console.log('User coverage:', result.user_coverage_percentage + '%');
```

## 🏗️ Project Structure

```
complexity backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application and endpoints
│   ├── config.py            # Configuration and settings
│   ├── models.py            # Pydantic models for request/response
│   └── algorithms/
│       ├── __init__.py
│       └── greedy.py        # Greedy algorithm implementation
├── pyproject.toml           # Poetry dependencies and configuration
├── .env                     # Environment variables
├── .env.example             # Example environment variables
├── .gitignore              # Git ignore file
└── README.md               # This file
```

## 🔧 Algorithm Details

### Greedy Algorithm

The greedy algorithm places antennas one at a time, always choosing the position that maximizes user coverage.

**How it works:**
1. For each antenna to place:
   - Evaluate all valid positions on the grid (not on houses)
   - Calculate coverage score: prioritize covering new users (houses) over empty cells
   - Score = (new_users × 10) + new_cells
   - Place the antenna at the position with maximum score
2. Continue until all antennas are placed
3. Track both area coverage and user coverage

**Key Features:**
- **Antenna Types**: Choose from small (r=2, 50 users), medium (r=3, 100 users), or large (r=4, 200 users)
- **User-Focused**: Prioritizes covering houses (users) over empty grid cells
- **House Rules**: Each house contains 10 users; antennas cannot be placed on houses
- **Capacity Tracking**: Monitors if antenna capacity meets user demand

**Complexity:**
- Time: O(n × w × h × r²) where n = antennas, w = width, h = height, r = radius
- Space: O(w × h)

**Pros:**
- Fast execution
- Prioritizes user coverage
- Simple to understand
- Good results for most cases

**Cons:**
- May not find the global optimum
- Greedy choices can lead to suboptimal later placements

## 🚀 Production Deployment

### Using Uvicorn directly

```powershell
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Docker (create Dockerfile if needed)

```dockerfile
FROM python:3.9-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.create false && poetry install --no-dev

COPY app ./app
COPY .env .env

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8000` |
| `HOST` | Server host | `0.0.0.0` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | `INFO` |

## 🧪 Development

### Adding New Algorithms

To add a new algorithm:

1. Create a new file in `app/algorithms/` (e.g., `genetic.py`)
2. Implement the algorithm class with an `optimize()` method
3. Update `app/main.py` to route to the new algorithm
4. Update the `OptimizationRequest.algorithm` validator

### Code Style

```powershell
# Format code
poetry run black app/

# Sort imports
poetry run isort app/
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For issues or questions, please check:
- Interactive API docs: http://localhost:8000/docs
- Logging output for detailed error information

## 🎯 Future Enhancements

- [ ] Genetic Algorithm implementation
- [ ] Simulated Annealing implementation
- [ ] Brute Force implementation
- [ ] WebSocket support for real-time updates
- [ ] Caching for repeated requests
- [ ] Rate limiting
- [ ] API authentication
- [ ] Performance benchmarks
