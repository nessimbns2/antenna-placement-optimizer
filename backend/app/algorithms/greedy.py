from typing import List, Tuple, Set, Dict
import logging
from app.models import AntennaType, AntennaSpec

logger = logging.getLogger(__name__)

USERS_PER_HOUSE = 20  # Each house contains 20 users


class GreedyAlgorithm:
    """Greedy algorithm for antenna placement using score-based optimization."""

    def __init__(
        self,
        width: int,
        height: int,
        antenna_specs: Dict[AntennaType, AntennaSpec],
        houses: List[Tuple[int, int]],
        allowed_antenna_types: List[AntennaType] | None = None,
        max_budget: int | None = None,
        max_antennas: int | None = None
    ):
        """
        Initialize the greedy algorithm.

        Args:
            width: Grid width
            height: Grid height
            antenna_specs: Dictionary of antenna specifications
            houses: List of house coordinates (each has 20 users)
            allowed_antenna_types: List of allowed antenna types (None = all types allowed)
            max_budget: Maximum budget constraint (None = no limit)
            max_antennas: Maximum number of antennas constraint (None = no limit)
        """
        self.width = width
        self.height = height
        self.max_budget = max_budget
        self.max_antennas = max_antennas

        # Filter antenna specs by allowed types
        if allowed_antenna_types:
            self.antenna_specs = {
                k: v for k, v in antenna_specs.items() if k in allowed_antenna_types}
        else:
            self.antenna_specs = antenna_specs

        self.houses = set(houses)  # Houses where antennas cannot be placed
        self.covered_cells: Set[Tuple[int, int]] = set()
        self.covered_houses: Set[Tuple[int, int]] = set()
        self.placed_antennas: List[Dict] = []

        logger.info(
            f"Initialized GreedyAlgorithm: {width}x{height} grid, "
            f"max_budget={max_budget}, max_antennas={max_antennas}, {len(houses)} houses"
        )

    def get_coverage_area(self, x: int, y: int, radius: int) -> Tuple[Set[Tuple[int, int]], Set[Tuple[int, int]]]:
        """
        Calculate the coverage area for an antenna at position (x, y) with given radius.

        Args:
            x: X coordinate
            y: Y coordinate
            radius: Coverage radius

        Returns:
            Tuple of (covered cells, covered houses)
        """
        covered_cells = set()
        covered_houses = set()

        for dx in range(-radius, radius + 1):
            for dy in range(-radius, radius + 1):
                # Check if within circle (Euclidean distance)
                if dx * dx + dy * dy <= radius * radius:
                    nx, ny = x + dx, y + dy

                    # Check if within grid bounds
                    if 0 <= nx < self.width and 0 <= ny < self.height:
                        if (nx, ny) in self.houses:
                            # This is a house - can be covered but antenna can't be placed here
                            covered_houses.add((nx, ny))
                        else:
                            # Regular cell
                            covered_cells.add((nx, ny))

        return covered_cells, covered_houses

    def count_new_coverage(self, x: int, y: int, radius: int) -> Tuple[int, int]:
        """
        Count how many new cells and users would be covered by placing an antenna at (x, y).

        Args:
            x: X coordinate
            y: Y coordinate
            radius: Coverage radius

        Returns:
            Tuple of (new cells covered, new users covered)
        """
        cells, houses = self.get_coverage_area(x, y, radius)
        new_cells = cells - self.covered_cells
        new_houses = houses - self.covered_houses
        new_users = len(new_houses) * USERS_PER_HOUSE
        return len(new_cells), new_users

    def is_valid_position(self, x: int, y: int) -> bool:
        """
        Check if a position is valid for antenna placement.
        Position must be within grid bounds and not on a house.

        Args:
            x: X coordinate
            y: Y coordinate

        Returns:
            True if valid, False otherwise
        """
        return (0 <= x < self.width and
                0 <= y < self.height and
                (x, y) not in self.houses)

    def calculate_score(self, new_users: int, antenna_capacity: int, cost: int, users_covered: int) -> float:
        """
        Calculate the score for an antenna placement.
        Score = (Coverage_Value + Capacity_Value - Waste_Value) / Cost

        Args:
            new_users: Number of new users that will be covered
            antenna_capacity: Maximum capacity of the antenna
            cost: Cost of the antenna
            users_covered: Current total users covered (before placing this antenna)

        Returns:
            Score value (higher is better)
        """
        if cost == 0:
            return 0

        # Coverage Value: New users covered
        coverage_value = new_users

        # Capacity Value: Additional capacity provided
        capacity_value = antenna_capacity

        # Waste Value: Capacity that exceeds covered users after placement
        total_capacity_after = sum(
            ant["max_users"] for ant in self.placed_antennas) + antenna_capacity
        total_users_after = users_covered + new_users
        waste_value = max(0, total_capacity_after - total_users_after)

        # Calculate final score
        score = (coverage_value + capacity_value - waste_value) / cost

        return score

    def find_best_antenna_placement(self) -> Tuple[Tuple[int, int], AntennaType, float] | None:
        """
        Find the best antenna placement using the score system.
        Score = (Coverage_Value + Capacity_Value - Waste_Value) / Cost

        Returns:
            Tuple of (position, antenna_type, score) or None if no valid placement
        """
        best_position = None
        best_antenna_type = None
        best_score = float('-inf')  # Higher is better

        users_covered = len(self.covered_houses) * USERS_PER_HOUSE

        # Try all antenna types
        for antenna_type, spec in self.antenna_specs.items():
            # Try all positions
            for x in range(self.width):
                for y in range(self.height):
                    if not self.is_valid_position(x, y):
                        continue

                    # Skip if antenna already placed here
                    if any(ant['x'] == x and ant['y'] == y for ant in self.placed_antennas):
                        continue

                    # Calculate new coverage
                    _, new_users = self.count_new_coverage(x, y, spec.radius)

                    # Calculate score for this placement
                    score = self.calculate_score(
                        new_users=new_users,
                        antenna_capacity=spec.max_users,
                        cost=spec.cost,
                        users_covered=users_covered
                    )

                    # Greedy principle: Select the placement with highest score
                    if score > best_score:
                        best_score = score
                        best_position = (x, y)
                        best_antenna_type = antenna_type

        if best_position is None:
            return None

        return best_position, best_antenna_type, best_score

    def optimize(self) -> Dict:
        """
        Run the greedy algorithm using score-based optimization.
        At each step, place the antenna with the highest score until constraints are met.

        Returns:
            Dictionary with optimization results including antenna positions, coverage, and costs
        """
        # Pretty header
        print("\n" + "="*70)
        print(f"🚀 SCORE-BASED GREEDY OPTIMIZATION")
        print("="*70)
        print(
            f"🏘️  Houses: {len(self.houses)} (Total users: {len(self.houses) * USERS_PER_HOUSE})")
        print(f"🗺️  Grid: {self.width}x{self.height}")
        print(f"📐 Score Formula: (Coverage + Capacity - Waste) / Cost")

        if self.max_budget:
            print(f"💵 Budget Limit: ${self.max_budget:,}")
        if self.max_antennas:
            print(f"📡 Antenna Limit: {self.max_antennas}")
        if not self.max_budget and not self.max_antennas:
            print(f"⚠️  No constraints set")

        print("="*70 + "\n")

        logger.info(f"Starting score-based greedy algorithm")

        total_users = len(self.houses) * USERS_PER_HOUSE
        iteration = 0
        max_iterations = self.width * self.height  # Prevent infinite loop

        while iteration < max_iterations:
            iteration += 1

            # Check current state
            total_cost = sum(ant["cost"] for ant in self.placed_antennas)
            num_antennas = len(self.placed_antennas)

            # Check constraints
            if self.max_antennas and num_antennas >= self.max_antennas:
                print(f"\n📡 Antenna limit reached: {num_antennas}")
                break

            if self.max_budget and total_cost >= self.max_budget:
                print(f"\n💰 Budget limit reached: ${total_cost:,}")
                break

            # Find best antenna placement using score
            result = self.find_best_antenna_placement()

            if result is None:
                users_covered = len(self.covered_houses) * USERS_PER_HOUSE
                total_capacity = sum(ant["max_users"]
                                     for ant in self.placed_antennas)
                logger.warning(
                    f"Could not find valid position for new antenna. "
                    f"Placed {num_antennas} antennas. "
                    f"Achieved {users_covered}/{total_users} users, capacity: {total_capacity}"
                )
                print(f"\n⚠️  No more valid placements available")
                break

            position, antenna_type, score = result
            spec = self.antenna_specs[antenna_type]

            # Check if we can afford this antenna
            if self.max_budget and (total_cost + spec.cost) > self.max_budget:
                logger.info(
                    f"Budget limit reached: ${total_cost} (next antenna would cost ${spec.cost})")
                print(f"\n💰 Budget limit reached: ${total_cost:,}")
                break

            # Place antenna
            antenna_data = {
                "x": position[0],
                "y": position[1],
                "type": antenna_type,
                "radius": spec.radius,
                "max_users": spec.max_users,
                "cost": spec.cost
            }
            self.placed_antennas.append(antenna_data)

            # Update coverage
            cells, houses = self.get_coverage_area(
                position[0], position[1], spec.radius)
            self.covered_cells.update(cells)
            new_houses = houses - self.covered_houses
            self.covered_houses.update(houses)

            users_covered = len(self.covered_houses) * USERS_PER_HOUSE
            current_coverage = (users_covered / total_users *
                                100) if total_users > 0 else 0
            new_cost = total_cost + spec.cost

            # Calculate current capacity utilization
            current_capacity = sum(ant["max_users"]
                                   for ant in self.placed_antennas)
            current_capacity_pct = (
                users_covered / current_capacity * 100) if current_capacity > 0 else 0

            # Pretty progress print every antenna
            antenna_emoji = {"Femto": "📱", "Pico": "📡",
                             "Micro": "🗼", "Macro": "🏗️"}
            emoji = antenna_emoji.get(antenna_type.value, "📡")

            print(f"{emoji} Antenna #{len(self.placed_antennas):2d}: {antenna_type.value:6s} @ ({position[0]:3d},{position[1]:3d}) "
                  f"| Score: {score:7.2f} | Cost: ${spec.cost:>6,} | Coverage: {current_coverage:5.1f}% "
                  f"| Capacity: {current_capacity_pct:5.1f}% | Total: ${new_cost:>8,}")

            logger.debug(
                f"Placed {antenna_type.value} antenna #{len(self.placed_antennas)} at {position}, "
                f"score: {score:.2f}, cost: ${spec.cost}, new users: {len(new_houses) * USERS_PER_HOUSE}, "
                f"total coverage: {current_coverage:.1f}%"
            )

        # Calculate final statistics
        total_cells = self.width * self.height - len(self.houses)
        coverage_percentage = (len(self.covered_cells) /
                               total_cells * 100) if total_cells > 0 else 0

        users_covered = len(self.covered_houses) * USERS_PER_HOUSE
        user_coverage_percentage = (
            users_covered / total_users * 100) if total_users > 0 else 0

        total_capacity = sum(ant["max_users"] for ant in self.placed_antennas)
        capacity_utilization = (
            users_covered / total_capacity * 100) if total_capacity > 0 else 0
        wasted_capacity = max(0, total_capacity - users_covered)

        total_cost = sum(ant["cost"] for ant in self.placed_antennas)

        # Pretty summary
        print("\n" + "="*70)
        print("✨ OPTIMIZATION COMPLETE")
        print("="*70)
        print(f"📡 Antennas Placed: {len(self.placed_antennas)}")
        print(f"💰 Total Cost: ${total_cost:,}")
        print(
            f"👥 Users Covered: {users_covered}/{total_users} ({user_coverage_percentage:.2f}%)")
        print(f"📊 Area Coverage: {coverage_percentage:.2f}%")
        print(
            f"🔋 Capacity: {total_capacity:,} users ({capacity_utilization:.1f}% utilized)")
        print(
            f"⚠️  Wasted Capacity: {wasted_capacity:,} users ({100 - capacity_utilization:.1f}%)")
        print("="*70 + "\n")

        logger.info(
            f"Score-based greedy algorithm complete: "
            f"{len(self.placed_antennas)} antennas placed, "
            f"total cost: ${total_cost}, "
            f"{coverage_percentage:.2f}% area coverage, "
            f"{users_covered}/{total_users} users covered ({user_coverage_percentage:.2f}%)"
        )

        return {
            "antennas": self.placed_antennas,
            "coverage_percentage": coverage_percentage,
            "users_covered": users_covered,
            "total_users": total_users,
            "user_coverage_percentage": user_coverage_percentage,
            "total_capacity": total_capacity,
            "capacity_utilization": capacity_utilization,
            "wasted_capacity": wasted_capacity,
            "total_cost": total_cost
        }
