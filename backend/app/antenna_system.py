"""
Antenna Placement System - Grid-based with Capacity Constraints
Follows strict rules for coverage radius, capacity assignment, and constraints.
"""

from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional, Set
import math


# ========================
# DATA MODELS
# ========================

@dataclass
class Zone:
    """Represents a grid location with user demand"""
    id: int
    x: int  # grid coordinate
    y: int  # grid coordinate
    users: int  # user demand (20-2000)


@dataclass
class AntennaType:
    """Antenna specification with coverage and capacity"""
    name: str
    coverage_radius_m: int  # coverage radius in meters
    capacity_users: int  # maximum users this antenna can serve
    cost: int  # cost in currency units

    @property
    def coverage_radius_squares(self) -> float:
        """Convert coverage radius from meters to grid squares (1 square = 50m)"""
        return self.coverage_radius_m / 50.0


# Predefined antenna types
ANTENNA_TYPES = {
    'Macro': AntennaType('Macro', coverage_radius_m=5000, capacity_users=2000, cost=25000),
    'Micro': AntennaType('Micro', coverage_radius_m=2000, capacity_users=500, cost=12000),
    'Pico': AntennaType('Pico', coverage_radius_m=300, capacity_users=100, cost=5000),
    'Femto': AntennaType('Femto', coverage_radius_m=50, capacity_users=20, cost=1000),
}


@dataclass
class PlacedAntenna:
    """Represents an antenna placed on the grid"""
    antenna_type: AntennaType
    x: int  # grid coordinate
    y: int  # grid coordinate
    id: int  # unique identifier

    # Assignment tracking
    covered_zones: List[Zone] = None  # zones within coverage radius
    served_zones: List[Zone] = None  # zones actually assigned to this antenna
    remaining_capacity: int = 0  # remaining user capacity

    def __post_init__(self):
        if self.covered_zones is None:
            self.covered_zones = []
        if self.served_zones is None:
            self.served_zones = []
        self.remaining_capacity = self.antenna_type.capacity_users


# ========================
# DISTANCE & COVERAGE
# ========================

def euclidean_distance(x1: int, y1: int, x2: int, y2: int) -> float:
    """Calculate Euclidean distance between two grid points"""
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)


def is_zone_covered(zone: Zone, antenna: PlacedAntenna) -> bool:
    """
    Check if a zone is within coverage radius of an antenna.
    Uses PERFECT circle with Euclidean distance.
    """
    distance = euclidean_distance(zone.x, zone.y, antenna.x, antenna.y)
    return distance <= antenna.antenna_type.coverage_radius_squares


# ========================
# ANTENNA PLACEMENT SYSTEM
# ========================

class AntennaPlacementSystem:
    """Main system for managing antenna placement and user assignment"""

    def __init__(self, zones: List[Zone], budget_limit: Optional[int] = None,
                 max_antennas: Optional[int] = None):
        self.zones = zones
        self.budget_limit = budget_limit
        self.max_antennas = max_antennas
        self.placed_antennas: List[PlacedAntenna] = []
        self.next_antenna_id = 1

        # Track which zones are occupied (cannot place antennas on zones)
        self.occupied_positions: Set[Tuple[int, int]] = {
            (z.x, z.y) for z in zones}

    def can_place_antenna(self, x: int, y: int) -> bool:
        """Check if an antenna can be placed at position (x, y)"""
        # Cannot place on zone squares
        if (x, y) in self.occupied_positions:
            return False
        return True

    def place_antenna(self, antenna_type_name: str, x: int, y: int) -> Optional[PlacedAntenna]:
        """
        Place an antenna at the specified position.
        Returns the placed antenna or None if placement is invalid.
        """
        # Validate position
        if not self.can_place_antenna(x, y):
            return None

        # Check max antennas constraint
        if self.max_antennas is not None and len(self.placed_antennas) >= self.max_antennas:
            return None

        # Get antenna type
        antenna_type = ANTENNA_TYPES.get(antenna_type_name)
        if antenna_type is None:
            return None

        # Check budget constraint
        total_cost = self.get_total_cost() + antenna_type.cost
        if self.budget_limit is not None and total_cost > self.budget_limit:
            return None

        # Create and place antenna
        antenna = PlacedAntenna(
            antenna_type=antenna_type,
            x=x,
            y=y,
            id=self.next_antenna_id
        )
        self.next_antenna_id += 1
        self.placed_antennas.append(antenna)

        return antenna

    def compute_coverage(self):
        """
        Compute which zones each antenna covers based on Euclidean distance.
        Does NOT assign users yet - only determines coverage.
        """
        for antenna in self.placed_antennas:
            antenna.covered_zones = []
            for zone in self.zones:
                if is_zone_covered(zone, antenna):
                    antenna.covered_zones.append(zone)

    def assign_users(self):
        """
        Assign zones to antennas based on capacity constraints.

        Algorithm:
        1. For each antenna, compute distances to all covered zones
        2. Sort zones by distance (closest first)
        3. Assign zones until capacity is reached
        4. Each zone can only be assigned to ONE antenna
        5. If multiple antennas cover a zone, assign to nearest with capacity
        """
        # Track which zones have been assigned
        assigned_zones: Set[int] = set()

        # Reset all antenna assignments
        for antenna in self.placed_antennas:
            antenna.served_zones = []
            antenna.remaining_capacity = antenna.antenna_type.capacity_users

        # Create a list of all (antenna, zone, distance) tuples
        coverage_candidates: List[Tuple[PlacedAntenna, Zone, float]] = []

        for antenna in self.placed_antennas:
            for zone in antenna.covered_zones:
                distance = euclidean_distance(
                    zone.x, zone.y, antenna.x, antenna.y)
                coverage_candidates.append((antenna, zone, distance))

        # Sort by distance (closest zones first)
        coverage_candidates.sort(key=lambda x: x[2])

        # Assign zones to antennas
        for antenna, zone, distance in coverage_candidates:
            # Skip if zone already assigned
            if zone.id in assigned_zones:
                continue

            # Check if antenna has capacity
            if antenna.remaining_capacity >= zone.users:
                antenna.served_zones.append(zone)
                antenna.remaining_capacity -= zone.users
                assigned_zones.add(zone.id)

    def get_total_cost(self) -> int:
        """Calculate total cost of all placed antennas"""
        return sum(antenna.antenna_type.cost for antenna in self.placed_antennas)

    def get_total_served_users(self) -> int:
        """Calculate total number of users served by all antennas"""
        return sum(
            sum(zone.users for zone in antenna.served_zones)
            for antenna in self.placed_antennas
        )

    def get_total_users(self) -> int:
        """Calculate total number of users in all zones"""
        return sum(zone.users for zone in self.zones)

    def get_coverage_percentage(self) -> float:
        """Calculate percentage of users served"""
        total = self.get_total_users()
        if total == 0:
            return 0.0
        return (self.get_total_served_users() / total) * 100

    def check_constraints(self) -> Dict[str, bool]:
        """Check if budget and antenna count constraints are satisfied"""
        constraints = {}

        if self.budget_limit is not None:
            constraints['budget_satisfied'] = self.get_total_cost(
            ) <= self.budget_limit

        if self.max_antennas is not None:
            constraints['max_antennas_satisfied'] = len(
                self.placed_antennas) <= self.max_antennas

        return constraints

    def generate_report(self) -> str:
        """Generate a comprehensive report of the antenna placement system"""
        lines = []
        lines.append("=" * 80)
        lines.append("ANTENNA PLACEMENT SYSTEM REPORT")
        lines.append("=" * 80)
        lines.append("")

        # Summary statistics
        lines.append("SUMMARY:")
        lines.append(f"  Total Zones: {len(self.zones)}")
        lines.append(f"  Total Users: {self.get_total_users()}")
        lines.append(f"  Placed Antennas: {len(self.placed_antennas)}")
        lines.append(f"  Total Cost: ${self.get_total_cost():,}")
        lines.append(f"  Users Served: {self.get_total_served_users()}")
        lines.append(f"  Coverage: {self.get_coverage_percentage():.2f}%")
        lines.append("")

        # Constraints
        constraints = self.check_constraints()
        if constraints:
            lines.append("CONSTRAINTS:")
            if self.budget_limit is not None:
                status = "✓ SATISFIED" if constraints['budget_satisfied'] else "✗ VIOLATED"
                lines.append(
                    f"  Budget Limit: ${self.budget_limit:,} - {status}")
            if self.max_antennas is not None:
                status = "✓ SATISFIED" if constraints['max_antennas_satisfied'] else "✗ VIOLATED"
                lines.append(f"  Max Antennas: {self.max_antennas} - {status}")
            lines.append("")

        # Detailed antenna information
        lines.append("ANTENNA DETAILS:")
        lines.append("")

        for antenna in self.placed_antennas:
            lines.append(
                f"Antenna #{antenna.id} - {antenna.antenna_type.name}")
            lines.append(f"  Position: ({antenna.x}, {antenna.y})")
            lines.append(
                f"  Coverage Radius: {antenna.antenna_type.coverage_radius_squares:.1f} squares ({antenna.antenna_type.coverage_radius_m}m)")
            lines.append(
                f"  Capacity: {antenna.antenna_type.capacity_users} users")
            lines.append(f"  Cost: ${antenna.antenna_type.cost:,}")
            lines.append(f"  Zones Covered: {len(antenna.covered_zones)}")

            if antenna.covered_zones:
                zone_ids = [str(z.id) for z in antenna.covered_zones]
                lines.append(f"    Zone IDs: {', '.join(zone_ids)}")

            lines.append(f"  Zones Served: {len(antenna.served_zones)}")

            if antenna.served_zones:
                served_info = []
                for zone in antenna.served_zones:
                    dist = euclidean_distance(
                        zone.x, zone.y, antenna.x, antenna.y)
                    served_info.append(
                        f"Zone {zone.id} ({zone.users} users, {dist:.1f} sq)")
                lines.append(f"    {', '.join(served_info)}")

            served_users = sum(z.users for z in antenna.served_zones)
            lines.append(
                f"  Users Served: {served_users} / {antenna.antenna_type.capacity_users}")
            lines.append(
                f"  Remaining Capacity: {antenna.remaining_capacity} users")
            lines.append("")

        # Unserved zones
        served_zone_ids = set()
        for antenna in self.placed_antennas:
            for zone in antenna.served_zones:
                served_zone_ids.add(zone.id)

        unserved_zones = [z for z in self.zones if z.id not in served_zone_ids]

        if unserved_zones:
            lines.append("UNSERVED ZONES:")
            for zone in unserved_zones:
                lines.append(
                    f"  Zone {zone.id} at ({zone.x}, {zone.y}) - {zone.users} users")
            lines.append("")

        lines.append("=" * 80)

        return "\n".join(lines)


# ========================
# EXAMPLE / TEST
# ========================

def run_example():
    """Run the example with provided test data"""

    # Create zones from example data
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

    # Create system with constraints
    system = AntennaPlacementSystem(
        zones=zones,
        budget_limit=100000,  # $100,000 budget
        max_antennas=10  # Maximum 10 antennas (one per zone)
    )

    # Place antennas strategically
    # IMPORTANT: Zones are ~548 squares apart, but Macro coverage is only 100 squares
    # This means each antenna can typically only cover 1 zone
    # Strategy: Place cheaper antennas near each zone based on its user demand

    # Zone 1: 50 users - use Pico (100 capacity, $5000)
    system.place_antenna('Pico', x=2, y=2)

    # Zone 2: 1 user - use Femto (20 capacity, $1000)
    system.place_antenna('Femto', x=54, y=548)

    # Zone 3: 5 users - use Femto (20 capacity, $1000)
    system.place_antenna('Femto', x=107, y=1094)

    # Zone 4: 70 users - use Pico (100 capacity, $5000)
    system.place_antenna('Pico', x=160, y=1640)

    # Zone 5: 47 users - use Pico (100 capacity, $5000)
    system.place_antenna('Pico', x=213, y=2186)

    # Zone 6: 53 users - use Pico (100 capacity, $5000)
    system.place_antenna('Pico', x=266, y=2732)

    # Zone 7: 60 users - use Pico (100 capacity, $5000)
    system.place_antenna('Pico', x=319, y=3278)

    # Zone 8: 66 users - use Pico (100 capacity, $5000)
    system.place_antenna('Pico', x=372, y=3824)

    # Zone 9: 73 users - use Pico (100 capacity, $5000)
    system.place_antenna('Pico', x=425, y=4370)

    # Zone 10: 79 users - use Pico (100 capacity, $5000)
    system.place_antenna('Pico', x=478, y=4916)

    # Compute coverage and assign users
    system.compute_coverage()
    system.assign_users()

    # Generate and print report
    report = system.generate_report()
    print(report)

    return system


if __name__ == "__main__":
    run_example()
