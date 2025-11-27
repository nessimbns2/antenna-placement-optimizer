"""Debug script to understand zone distances"""
import math
from antenna_system import Zone, AntennaType, ANTENNA_TYPES

zones_data = [
    (1, 1, 1, 50),
    (2, 54, 547, 1),
    (3, 107, 1093, 5),
    (4, 160, 1639, 70),
    (5, 213, 2185, 47),
    (6, 266, 2731, 53),
    (7, 319, 3277, 60),
    (8, 372, 3823, 66),
    (9, 425, 4369, 73),
    (10, 478, 4915, 79),
]

zones = [Zone(id=zid, x=x, y=y, users=users)
         for zid, x, y, users in zones_data]

print("Zone Positions:")
for zone in zones:
    print(f"  Zone {zone.id}: ({zone.x}, {zone.y})")

print("\nAntenna Coverage Radii (in grid squares):")
for name, atype in ANTENNA_TYPES.items():
    print(f"  {name}: {atype.coverage_radius_squares:.1f} squares ({atype.coverage_radius_m}m)")

print("\nDistances between consecutive zones:")
for i in range(len(zones) - 1):
    z1 = zones[i]
    z2 = zones[i + 1]
    dist = math.sqrt((z2.x - z1.x)**2 + (z2.y - z1.y)**2)
    print(f"  Zone {z1.id} to Zone {z2.id}: {dist:.2f} squares")

# Test antenna placement at zone 3
test_antenna_pos = (107, 1093)
print(f"\nDistances from test position {test_antenna_pos} to all zones:")
for zone in zones:
    dist = math.sqrt(
        (zone.x - test_antenna_pos[0])**2 + (zone.y - test_antenna_pos[1])**2)
    print(f"  To Zone {zone.id} at ({zone.x}, {zone.y}): {dist:.2f} squares")

print(f"\nMacro antenna (100 sq radius) at {test_antenna_pos} would cover:")
for zone in zones:
    dist = math.sqrt(
        (zone.x - test_antenna_pos[0])**2 + (zone.y - test_antenna_pos[1])**2)
    if dist <= 100:
        print(f"  ✓ Zone {zone.id} (distance: {dist:.2f} sq)")
    else:
        print(f"  ✗ Zone {zone.id} (distance: {dist:.2f} sq) - TOO FAR")
