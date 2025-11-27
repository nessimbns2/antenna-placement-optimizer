"""
Test script to verify the antenna placement API with user coverage
"""
import requests
import json

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"✅ Health: {response.json()}\n")


def test_antenna_types():
    """Test antenna types endpoint"""
    print("🔍 Testing antenna types endpoint...")
    response = requests.get(f"{BASE_URL}/antenna-types")
    data = response.json()
    print(f"✅ Available antenna types:")
    for antenna in data["antenna_types"]:
        print(
            f"   - {antenna['type']}: radius={antenna['radius']}, max_users={antenna['max_users']}")
    print(f"   - Users per house: {data['users_per_house']}\n")


def test_optimization(max_budget=None, max_antennas=None, grid_size=20):
    """Test optimization endpoint with different constraints"""
    constraint_desc = []
    if max_budget:
        constraint_desc.append(f"budget=${max_budget:,}")
    if max_antennas:
        constraint_desc.append(f"max_antennas={max_antennas}")
    if not constraint_desc:
        constraint_desc.append("no constraints")

    print(
        f"🔍 Testing optimization with {', '.join(constraint_desc)} on {grid_size}x{grid_size} grid...")

    # Create a test scenario with multiple houses
    # Generate houses in a pattern
    obstacles = []
    for i in range(5):
        for j in range(5):
            obstacles.append([i * 4 + 2, j * 4 + 2])

    data = {
        "width": grid_size,
        "height": grid_size,
        "max_budget": max_budget,
        "max_antennas": max_antennas,
        "obstacles": obstacles,  # Multiple houses
        "algorithm": "greedy"
    }

    print(f"   Houses: {len(obstacles)} (total users: {len(obstacles) * 20})")

    response = requests.post(f"{BASE_URL}/optimize", json=data)

    if not response.ok:
        print(f"❌ Error: {response.status_code}")
        print(f"   {response.text}")
        return

    result = response.json()

    print(f"✅ Optimization Results ({', '.join(constraint_desc)}):")
    print(f"   Antennas placed: {len(result['antennas'])}")
    antenna_types = {}
    for antenna in result['antennas']:
        antenna_types[antenna['type']] = antenna_types.get(
            antenna['type'], 0) + 1

    for ant_type, count in antenna_types.items():
        print(f"   - {ant_type}: {count}")

    print(f"   Area coverage: {result['coverage_percentage']:.2f}%")
    print(
        f"   Users covered: {result['users_covered']}/{result['total_users']} ({result['user_coverage_percentage']:.2f}%)")
    print(f"   Total capacity: {result['total_capacity']} users")
    print(f"   Capacity utilization: {result['capacity_utilization']:.2f}%")
    print(f"   Total cost: ${result['total_cost']:,}")
    print(f"   Execution time: {result['execution_time_ms']:.2f}ms")
    print()


def main():
    """Run all tests"""
    print("=" * 60)
    print("🚀 Antenna Placement API - Test Suite")
    print("=" * 60)
    print()

    try:
        test_health()
        test_antenna_types()

        # Test with different constraint scenarios
        test_optimization(max_budget=50000, grid_size=20)
        test_optimization(max_antennas=10, grid_size=20)
        test_optimization(max_budget=100000, max_antennas=15, grid_size=15)
        test_optimization(grid_size=15)  # No constraints

        print("=" * 60)
        print("✅ All tests completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
