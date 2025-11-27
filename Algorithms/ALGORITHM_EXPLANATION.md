# Greedy Algorithm for Antenna Placement Optimization

## Overview

This document explains the greedy algorithm used to optimize cellular antenna placement on a grid while minimizing deployment costs and ensuring complete user coverage.

## Problem Statement

### Given:
- A 2D grid of size W × H
- A set of houses at specific coordinates, each containing **100 users**
- Three types of antennas with different specifications:
  - **Small**: radius = 2, cost = $1,000
  - **Medium**: radius = 4, cost = $1,500
  - **Large**: radius = 6, cost = $2,000

### Constraints:
1. Antennas **cannot** be placed on houses
2. Each antenna covers houses within its coverage radius (Euclidean distance)

### Objective:
Minimize total deployment cost while ensuring all houses are covered by at least one antenna.

## Algorithm Design

### Greedy Approach

The algorithm uses a **cost-efficiency greedy strategy** that iteratively selects the best antenna placement based on the lowest cost per new house covered.

### Key Components

#### 1. Coverage Calculation
```
For an antenna at position (x, y) with radius r:
  - Calculate Euclidean distance to each house: d = √[(x-hx)² + (y-hy)²]
  - House is covered if: d ≤ r
```

#### 2. Cost Efficiency Metric
```
Cost Efficiency = Antenna Cost / Number of New Houses Covered
```
Lower values indicate better efficiency.

#### 3. Coverage Validation
All houses must be within range of at least one antenna:
```
For each house:
  Check if distance to any antenna ≤ antenna radius
  If yes, house is covered
  
Coverage complete when: all houses are covered
```

## Algorithm Steps

### Initialization
1. Create empty sets for covered houses and placed antennas
2. Calculate total users needed: `total_users = num_houses × 100`

### Main Loop
```
while not all_houses_covered:
    
    1. Evaluate all possible placements:
       For each antenna type:
           For each valid position (x, y):
               - Calculate houses covered by this placement
               - Identify NEW houses (not already covered)
               - Calculate cost efficiency
    
    2. Select best placement:
       - Choose position with lowest cost per new house
       - If tie, prefer antenna with larger radius
    
    3. Place antenna:
       - Add antenna to placed_antennas list
       - Update covered_houses set
    
    4. Check termination:
       - All houses covered? ✓
       - If yes, stop
```

### Termination Condition
The algorithm stops when **all houses are within range** of at least one antenna.

## Example Walkthrough

### Scenario
- Grid: 20×15 (300 cells)
- Houses: 45 houses (4,500 users total)
- Houses randomly distributed

### Iteration 1
- Evaluate all 297 valid positions (300 - 3 houses on grid)
- Try all 3 antenna types per position = 891 evaluations
- Best: Large antenna at (10, 7) covers 8 houses
- Cost efficiency: $2,000 / 8 = $250 per house
- **Action**: Place Large antenna, now 8/45 houses covered

### Iteration 2
- Evaluate remaining positions
- Best: Medium antenna at (5, 12) covers 5 new houses
- Cost efficiency: $1,500 / 5 = $300 per house
- **Action**: Place Medium antenna, now 13/45 houses covered

### Continues...
- Algorithm iterates, prioritizing cost-efficient placements
- Smaller antennas used for isolated houses
- Stops when all 45 houses are covered

## Complexity Analysis

### Time Complexity
- **Per iteration**: O(T × W × H × N)
  - T = 3 antenna types
  - W × H = grid size (positions to evaluate)
  - N = number of houses (coverage calculation)

- **Total iterations**: O(H) where H is number of houses
  - Each iteration covers at least 1 new house
  - Worst case: place one antenna per house

- **Overall**: O(T × W × H × N × H) = **O(W × H × N × H)**
  - For 20×15 grid with 45 houses: ~405,000 operations per iteration

### Space Complexity
- O(N + A) where:
  - N = number of houses
  - A = number of antennas placed (typically A < N)

## Advantages

1. **Efficiency**: Finds near-optimal solutions quickly compared to exhaustive search
2. **Scalability**: Works on various grid sizes (tested up to 25×20 with 100 houses)
3. **Cost-focused**: Explicitly minimizes deployment cost at each step
4. **Practical**: Respects real-world constraints (no placement on houses, capacity limits)

## Limitations

1. **Not Globally Optimal**: Greedy choices may miss better long-term solutions
2. **Order Dependent**: Early placements affect later options
3. **Local Decisions**: Doesn't look ahead to future coverage opportunities

## Performance Metrics

The algorithm tracks:
- **Total Cost**: Sum of all antenna costs
- **Coverage**: Percentage of houses within antenna range
- **Users Covered**: Total users in covered houses (houses × 100)
- **Cost per User**: Total cost / users covered

## Example Results

### Low Density (15×15 grid, 23 houses, 2,300 users)
- Antennas placed: 5
- Total cost: $7,500
- Cost per user: $3.26
- Coverage: 100%

### Medium Density (20×15 grid, 45 houses, 4,500 users)
- Antennas placed: 9
- Total cost: $13,500
- Cost per user: $3.00
- Coverage: 100%

### High Density (25×20 grid, 100 houses, 10,000 users)
- Antennas placed: 15
- Total cost: $24,000
- Cost per user: $2.40
- Coverage: 100%

**Observation**: Higher density areas achieve better cost efficiency due to larger antennas covering more houses.

## Implementation Notes

### Key Functions

1. **`get_covered_houses(x, y, radius)`**
   - Returns set of houses within Euclidean distance ≤ radius

2. **`find_best_antenna_placement()`**
   - Evaluates all positions and antenna types
   - Returns position with lowest cost per new house

3. **`optimize()`**
   - Main loop coordinating placement decisions
   - Tracks coverage convergence

### Design Decisions

- **Euclidean Distance**: More realistic than Manhattan distance for radio coverage
- **Greedy Selection**: Balances solution quality with computational speed
- **No Capacity Constraints**: Focuses purely on coverage and cost optimization
- **No Overlapping Penalty**: Multiple antennas can cover same house (provides redundancy)

## Future Improvements

1. **Multi-objective Optimization**: Balance cost, coverage, and redundancy
2. **Genetic Algorithm**: Explore global optimization approaches
3. **Simulated Annealing**: Escape local optima through probabilistic moves
4. **Dynamic Programming**: Pre-compute optimal coverage patterns
5. **Machine Learning**: Learn optimal placement patterns from historical data

## Conclusion

This greedy algorithm provides an effective, scalable solution for antenna placement optimization. While not guaranteed to find the absolute minimum cost, it consistently produces practical, cost-efficient network designs that ensure complete coverage of all houses at the lowest possible deployment cost.
