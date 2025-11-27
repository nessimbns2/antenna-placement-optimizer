"""
Test script for simulated annealing algorithm.
"""
from app.models import ANTENNA_SPECS, AntennaType
from app.algorithms.simulated_annealing import SimulatedAnnealingAlgorithm
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


def test_simulated_annealing():
    """Test the simulated annealing algorithm with a small grid."""
    print("Testing Simulated Annealing Algorithm")
    print("=" * 50)

    # Create a small test grid
    width = 50
    height = 50

    # Add some houses (obstacles)
    houses = [
        (10, 10), (15, 10), (20, 10),
        (10, 20), (15, 20), (20, 20),
        (10, 30), (15, 30), (20, 30),
        (30, 10), (35, 10), (40, 10),
        (30, 20), (35, 20), (40, 20),
    ]

    print(f"Grid: {width}x{height}")
    print(f"Houses: {len(houses)}")
    print(f"Total users: {len(houses) * 20}")
    print()

    # Test with all antenna types
    algorithm = SimulatedAnnealingAlgorithm(
        width=width,
        height=height,
        antenna_specs=ANTENNA_SPECS,
        houses=houses,
        allowed_antenna_types=[
            AntennaType.FEMTO, AntennaType.PICO, AntennaType.MICRO, AntennaType.MACRO],
        max_budget=50000,
        max_antennas=10,
        initial_temperature=50.0,
        cooling_rate=0.95,
        min_temperature=0.1,
        iterations_per_temp=50
    )

    result = algorithm.optimize()

    print()
    print("Results:")
    print(f"  Antennas placed: {len(result['antennas'])}")
    print(f"  Total cost: ${result['total_cost']:,}")
    print(
        f"  Users covered: {result['users_covered']}/{result['total_users']} ({result['user_coverage_percentage']:.2f}%)")
    print(f"  Area coverage: {result['coverage_percentage']:.2f}%")
    print()
    print("Antenna details:")
    for i, ant in enumerate(result['antennas'], 1):
        print(
            f"  {i}. {ant['type'].value} at ({ant['x']}, {ant['y']}) - Radius: {ant['radius']}, Cost: ${ant['cost']}")

    return result


if __name__ == "__main__":
    test_simulated_annealing()
