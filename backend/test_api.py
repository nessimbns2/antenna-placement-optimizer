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


def test_optimization(antenna_type="Pico"):
    """Test optimization endpoint with different antenna types"""
    print(f"🔍 Testing optimization with {antenna_type} antenna...")

    # Create a test scenario: 10x10 grid with 3 houses
    data = {
        "width": 10,
        "height": 10,
        "num_antennas": 2,
        "antenna_type": antenna_type,
        # 3 houses = 60 users total (20 users per house)
        "obstacles": [[2, 3], [5, 5], [7, 8]],
        "algorithm": "greedy"
    }

    response = requests.post(f"{BASE_URL}/optimize", json=data)
    result = response.json()

    print(f"✅ Optimization Results ({antenna_type}):")
    print(f"   Antennas placed: {len(result['antennas'])}")
    for i, antenna in enumerate(result['antennas'], 1):
        print(
            f"   - Antenna {i}: ({antenna['x']}, {antenna['y']}) - {antenna['type']} (radius={antenna['radius']}, capacity={antenna['max_users']})")
    print(f"   Area coverage: {result['coverage_percentage']}%")
    print(
        f"   Users covered: {result['users_covered']}/{result['total_users']} ({result['user_coverage_percentage']}%)")
    print(f"   Total capacity: {result['total_capacity']} users")
    print(f"   Capacity utilization: {result['capacity_utilization']}%")
    print(f"   Execution time: {result['execution_time_ms']}ms")
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

        # Test with different antenna types
        test_optimization("Femto")
        test_optimization("Pico")
        test_optimization("Micro")
        test_optimization("Macro")

        print("=" * 60)
        print("✅ All tests completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
