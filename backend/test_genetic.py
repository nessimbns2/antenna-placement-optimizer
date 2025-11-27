"""Test script for genetic algorithm implementation."""
import sys
import time
from app.models import ANTENNA_SPECS
from app.algorithms.genetic import GeneticAlgorithm

# Sample test data (same as notebook)
GRID_WIDTH = 20
GRID_HEIGHT = 15

# Generate sample houses (45 houses, 15% density)
houses = [
    (13, 1), (16, 1), (6, 2), (0, 3), (10, 3), (15, 3), (18, 3), (7, 4),
    (14, 4), (2, 5), (7, 5), (9, 5), (10, 5), (18, 5), (19, 5), (5, 6),
    (8, 6), (9, 6), (11, 6), (19, 6), (1, 7), (3, 7), (5, 7), (8, 7),
    (15, 7), (18, 7), (10, 8), (12, 8), (13, 8), (2, 9), (5, 9), (8, 9),
    (14, 9), (1, 10), (5, 10), (11, 10), (15, 10), (16, 10), (17, 10),
    (2, 11), (9, 11), (12, 11), (7, 12), (11, 12), (15, 12)
]

print("="*70)
print("Testing Genetic Algorithm Implementation")
print("="*70)
print(f"Grid: {GRID_WIDTH}x{GRID_HEIGHT}")
print(f"Houses: {len(houses)}")
print(f"Total users: {len(houses) * 20}")
print(f"Antenna types: {list(ANTENNA_SPECS.keys())}")
print("="*70 + "\n")

# Initialize genetic algorithm
genetic_algo = GeneticAlgorithm(
    width=GRID_WIDTH,
    height=GRID_HEIGHT,
    antenna_specs=ANTENNA_SPECS,
    houses=houses,
    allowed_antenna_types=None,  # All types allowed
    max_budget=None,
    max_antennas=None,
    population_size=30,
    generations=50,
    mutation_rate=0.15,
    crossover_rate=0.7
)

# Run optimization
print("\nRunning optimization...\n")
start_time = time.time()
result = genetic_algo.optimize()
execution_time = (time.time() - start_time) * 1000

# Print results
print("\n" + "="*70)
print("RESULTS")
print("="*70)
print(f"✓ Antennas placed: {len(result['antennas'])}")
print(f"✓ Total cost: ${result['total_cost']:,}")
print(f"✓ Houses covered: {result['users_covered'] // 20}/{result['total_users'] // 20}")
print(f"✓ Users covered: {result['users_covered']:,}/{result['total_users']:,}")
print(f"✓ User coverage: {result['user_coverage_percentage']:.1f}%")
print(f"✓ Area coverage: {result['coverage_percentage']:.1f}%")
print(f"✓ Execution time: {execution_time:.2f} ms")
print("="*70)

# Print antenna breakdown
print("\nAntenna Breakdown:")
antenna_counts = {}
antenna_costs = {}
for antenna in result['antennas']:
    ant_type = antenna['type']
    antenna_counts[ant_type] = antenna_counts.get(ant_type, 0) + 1
    antenna_costs[ant_type] = antenna_costs.get(ant_type, 0) + antenna['cost']

for ant_type in sorted(antenna_counts.keys(), key=lambda x: x.value):
    count = antenna_counts[ant_type]
    cost = antenna_costs[ant_type]
    print(f"  {ant_type.value}: {count} antenna(s) - ${cost:,}")

print("\nTest completed successfully! ✓")
