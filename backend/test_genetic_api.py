"""Test genetic algorithm via API endpoint."""
import requests
import json
import time

API_URL = "http://localhost:8000"

# Sample test data
houses = [
    [13, 1], [16, 1], [6, 2], [0, 3], [10, 3], [15, 3], [18, 3], [7, 4],
    [14, 4], [2, 5], [7, 5], [9, 5], [10, 5], [18, 5], [19, 5], [5, 6],
    [8, 6], [9, 6], [11, 6], [19, 6], [1, 7], [3, 7], [5, 7], [8, 7],
    [15, 7], [18, 7], [10, 8], [12, 8], [13, 8], [2, 9], [5, 9], [8, 9],
    [14, 9], [1, 10], [5, 10], [11, 10], [15, 10], [16, 10], [17, 10],
    [2, 11], [9, 11], [12, 11], [7, 12], [11, 12], [15, 12]
]

print("="*70)
print("Testing Genetic Algorithm via API")
print("="*70)

# Test request
request_data = {
    "width": 20,
    "height": 15,
    "obstacles": houses,
    "algorithm": "genetic",
    "allowed_antenna_types": ["Femto", "Pico", "Micro", "Macro"],
    "max_budget": None,
    "max_antennas": None
}

print(f"Sending request to {API_URL}/optimize")
print(f"Houses: {len(houses)}")
print(f"Algorithm: genetic")
print("\nWaiting for response...\n")

start_time = time.time()
response = requests.post(
    f"{API_URL}/optimize",
    json=request_data,
    headers={"Content-Type": "application/json"}
)
api_time = (time.time() - start_time) * 1000

if response.status_code == 200:
    data = response.json()
    print("="*70)
    print("API RESPONSE - SUCCESS")
    print("="*70)
    print(f"✓ Antennas placed: {len(data['antennas'])}")
    print(f"✓ Total cost: ${data['total_cost']:,}")
    print(f"✓ Users covered: {data['users_covered']}/{data['total_users']}")
    print(f"✓ User coverage: {data['user_coverage_percentage']:.1f}%")
    print(f"✓ Area coverage: {data['coverage_percentage']:.1f}%")
    print(f"✓ Algorithm execution time: {data['execution_time_ms']:.2f} ms")
    print(f"✓ Total API time: {api_time:.2f} ms")
    print("="*70)
    
    # Antenna breakdown
    antenna_counts = {}
    for antenna in data['antennas']:
        ant_type = antenna['type']
        antenna_counts[ant_type] = antenna_counts.get(ant_type, 0) + 1
    
    print("\nAntenna Breakdown:")
    for ant_type, count in sorted(antenna_counts.items()):
        print(f"  {ant_type}: {count} antenna(s)")
    
    print("\nAPI test completed successfully! ✓")
else:
    print(f"❌ API Error: {response.status_code}")
    print(response.text)
