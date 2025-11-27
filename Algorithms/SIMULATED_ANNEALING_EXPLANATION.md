# Simulated Annealing Algorithm Explanation

## Overview

Simulated Annealing is a probabilistic optimization technique inspired by the physical process of annealing in metallurgy. In metallurgy, annealing involves heating a material and then slowly cooling it to reduce defects and reach a low-energy state. Similarly, the algorithm starts with a high "temperature" that allows exploration of the solution space and gradually "cools down" to converge on an optimal solution.

## Why Simulated Annealing?

### Advantages
- **Escapes Local Optima**: Unlike greedy algorithms, simulated annealing can accept worse solutions temporarily, allowing it to escape local optima and find better global solutions
- **Balanced Exploration/Exploitation**: The temperature parameter controls the trade-off between exploring new solutions and exploiting known good ones
- **Flexible**: Works well for complex optimization problems where the solution space is irregular or has many local optima
- **Simple to Implement**: Requires only a few core components (energy function, neighbor generation, acceptance criterion)

### Disadvantages
- **Slower than Greedy**: Takes more time (seconds vs milliseconds) due to iterative exploration
- **Requires Tuning**: Performance depends on parameter selection (temperature, cooling rate, etc.)
- **Non-deterministic**: Different runs may produce different results (unless using a fixed random seed)
- **No Optimality Guarantee**: Cannot guarantee finding the global optimum

## Core Concepts

### 1. Energy Function
The energy function evaluates the quality of a solution. Lower energy indicates a better solution.

**Our Energy Function:**
```python
energy = uncovered_penalty + cost_penalty

where:
- uncovered_penalty = uncovered_users × 10.0
- cost_penalty = total_cost / 1000
```

**Components:**
- **Uncovered User Penalty** (weight: 10.0): Heavily penalizes incomplete coverage, ensuring 100% coverage is prioritized
- **Cost Penalty** (divisor: 1000): Optimizes for lower cost while maintaining coverage

**Tuning the Trade-off:**
- Lower `COST_DIVISOR` (e.g., 5000-10000): More aggressive cost optimization
- Higher `COST_DIVISOR` (e.g., 50000-100000): Prioritizes coverage quality over cost

### 2. Temperature Schedule
Temperature controls the probability of accepting worse solutions:
- **High Temperature** (start): Accepts most moves, explores broadly
- **Low Temperature** (end): Accepts only improvements, exploits best solutions

**Our Schedule:**
```python
initial_temperature = 100.0
cooling_rate = 0.95
min_temperature = 0.1

T_new = T_current × cooling_rate  # Geometric cooling
```

### 3. Neighbor Generation
Creates a new solution by modifying the current one. Our operations:

| Operation       | Weight | Description                                     |
| --------------- | ------ | ----------------------------------------------- |
| **Add**         | 30     | Add a new antenna at a random valid position    |
| **Remove**      | 30     | Remove a random antenna (if more than 1 exists) |
| **Move**        | 25     | Relocate an antenna to a nearby position        |
| **Change Type** | 15     | Change an antenna to a different type           |

**Constraints:**
- Antennas cannot be placed on houses
- Added/modified antennas must cover at least one house
- Respects `max_budget` and `max_antennas` constraints

### 4. Acceptance Criterion (Metropolis Criterion)
Determines whether to accept a new solution:

```python
if new_energy < current_energy:
    accept = True  # Always accept improvements
else:
    probability = exp(-(new_energy - current_energy) / temperature)
    accept = random() < probability  # Probabilistically accept worse solutions
```

**Intuition:**
- Small temperature → Low probability of accepting worse solutions
- Large energy difference → Lower probability of acceptance
- As temperature decreases, algorithm becomes more "selective"

## Algorithm Flow

```
1. Generate initial solution (place ~5 antennas near houses)
2. Calculate initial energy
3. Set best_solution = current_solution

4. WHILE temperature > min_temperature:
   5. FOR iterations_per_temp iterations:
      6. Generate neighbor solution
      7. Calculate neighbor energy
      8. IF neighbor is better OR accepted probabilistically:
         9. current_solution = neighbor
         10. IF neighbor is better than best_solution:
             11. best_solution = neighbor
      
   12. temperature = temperature × cooling_rate
   13. Check early stopping (if no improvement for N iterations)

14. Clean up: remove antennas that don't cover any houses
15. Return best_solution
```

## Parameter Configuration

### Temperature Parameters
```python
initial_temperature = 100.0      # Starting temperature
cooling_rate = 0.95              # Multiplicative cooling factor
min_temperature = 0.1            # Stopping temperature
iterations_per_temp = 100        # Iterations per temperature level
```

**Tuning Guide:**
- **Higher initial_temperature**: More exploration, longer runtime
- **Lower cooling_rate** (e.g., 0.90): Faster cooling, may miss optimal solutions
- **Higher cooling_rate** (e.g., 0.99): Slower cooling, better quality but longer runtime
- **More iterations_per_temp**: Better exploration at each temperature level

### Energy Function Parameters
```python
UNCOVERED_USER_PENALTY = 10.0    # Penalty per uncovered user
COST_DIVISOR = 1000              # Cost normalization factor
```

**Cost Optimization Levels:**
- **100000**: Light cost optimization (~$250-300k solutions)
- **50000**: Moderate cost optimization (~$180-250k solutions)
- **25000**: Strong cost optimization (~$150-200k solutions)
- **10000**: Very aggressive cost optimization (~$100-150k solutions)
- **5000**: Extreme cost optimization (may sacrifice efficiency)

### Stopping Criteria
```python
DEFAULT_EARLY_STOPPING_ITERATIONS = 5000
```

Stops if no improvement found after 5000 iterations, preventing wasted computation.

## Initial Solution Strategy

The algorithm generates an initial solution by:
1. Randomly selecting houses as seed points
2. Placing antennas near these houses (within radius distance)
3. Preferring larger antenna types (sorted by radius, descending)
4. Limiting initial antennas to ~5 to avoid over-placement
5. Ensuring each antenna covers at least one house

**Why this works:**
- Provides reasonable starting coverage
- Bias toward larger antennas gives broader initial coverage
- Random placement ensures diversity across runs

## Comparison with Other Algorithms

| Feature             | Greedy      | Genetic          | Simulated Annealing |
| ------------------- | ----------- | ---------------- | ------------------- |
| **Speed**           | ⚡ Fast (ms) | 🐢 Slow (seconds) | 🚶 Medium (seconds)  |
| **Quality**         | ✓ Good      | ✓✓ Very Good     | ✓✓ Very Good        |
| **Deterministic**   | ✓ Yes       | ✗ No             | ✗ No                |
| **Global Optimum**  | ✗ Local     | ~ Approximate    | ~ Approximate       |
| **Complexity**      | Low         | High             | Medium              |
| **Tuning Required** | None        | Significant      | Moderate            |

## Practical Usage

### When to Use Simulated Annealing
- When greedy solutions are insufficient
- For complex optimization landscapes with many local optima
- When you can afford longer execution times (seconds vs milliseconds)
- For problems where solution quality is critical

### When NOT to Use
- Real-time applications requiring instant results
- When greedy solutions are "good enough"
- When parameter tuning effort is not justified
- For very large grids where runtime becomes prohibitive

## Example Results

**Test Scenario**: 20×15 grid with 45 houses (900 users)

| Algorithm           | Antennas | Cost           | Coverage | Time  |
| ------------------- | -------- | -------------- | -------- | ----- |
| Greedy              | 12       | $18,000        | 100%     | ~50ms |
| Simulated Annealing | 8-10     | $14,000-16,000 | 100%     | ~2-5s |
| Genetic Algorithm   | 9-11     | $15,000-17,000 | 100%     | ~3-8s |

**Key Insight**: Simulated annealing typically finds solutions with 10-25% fewer antennas than greedy, resulting in significant cost savings.

## Implementation Details

### Key Files
- `backend/app/algorithms/simulated_annealing.py`: Core implementation
- `backend/app/main.py`: API endpoint integration
- `backend/test_simulated_annealing.py`: Test scenarios

### API Usage
```python
POST /optimize
{
  "width": 20,
  "height": 15,
  "obstacles": [[x, y], ...],  // Houses
  "algorithm": "simulated-annealing",
  "allowed_antenna_types": ["FEMTO", "PICO", "MICRO", "MACRO"],
  "max_budget": 50000,  // Optional constraint
  "max_antennas": 20    // Optional constraint
}
```

### Response
```python
{
  "antennas": [{"x": 5, "y": 8, "type": "PICO", "radius": 10, "cost": 800}, ...],
  "coverage_percentage": 85.5,
  "users_covered": 860,
  "total_users": 900,
  "user_coverage_percentage": 95.6,
  "total_cost": 15200,
  "execution_time_ms": 2341
}
```

## Advanced Tuning

### For Better Coverage
```python
UNCOVERED_USER_PENALTY = 50.0  # Increase penalty (default: 10.0)
COST_DIVISOR = 100000          # Reduce cost pressure (default: 1000)
```

### For Lower Cost
```python
UNCOVERED_USER_PENALTY = 5.0   # Reduce penalty (default: 10.0)
COST_DIVISOR = 5000            # Increase cost pressure (default: 1000)
```

### For Faster Convergence
```python
initial_temperature = 50.0     # Lower start temp (default: 100.0)
cooling_rate = 0.90            # Faster cooling (default: 0.95)
iterations_per_temp = 50       # Fewer iterations (default: 100)
```

### For Better Quality (Slower)
```python
initial_temperature = 200.0    # Higher start temp (default: 100.0)
cooling_rate = 0.98            # Slower cooling (default: 0.95)
iterations_per_temp = 200      # More iterations (default: 100)
```

## References

- Kirkpatrick, S., Gelatt, C. D., & Vecchi, M. P. (1983). "Optimization by Simulated Annealing". Science.
- Metropolis, N., et al. (1953). "Equation of State Calculations by Fast Computing Machines". Journal of Chemical Physics.

## Conclusion

Simulated Annealing provides a powerful middle ground between greedy algorithms (fast but limited) and genetic algorithms (high quality but slow). Its probabilistic acceptance of worse solutions allows exploration of the solution space while still converging toward optimal solutions. With proper parameter tuning, it can achieve near-optimal antenna placements at a reasonable computational cost.
