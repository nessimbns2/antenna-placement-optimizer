from typing import List, Tuple, Set, Dict
import logging
from app.models import AntennaType, AntennaSpec

logger = logging.getLogger(__name__)

USERS_PER_HOUSE = 20  # Each house contains 20 users


class GreedyAlgorithm:
    """Greedy algorithm for cost-optimized antenna placement with user coverage target."""

    def __init__(
        self,
        width: int,
        height: int,
        target_coverage: float,
        antenna_specs: Dict[AntennaType, AntennaSpec],
        houses: List[Tuple[int, int]],
        allowed_antenna_types: List[AntennaType] | None = None,
        optimization_mode: str = "coverage",
        max_budget: int | None = None,
        max_antennas: int | None = None
    ):
        """
        Initialize the greedy algorithm.

        Args:
            width: Grid width
            height: Grid height
            target_coverage: Target user coverage percentage (0-100)
            antenna_specs: Dictionary of antenna specifications
            houses: List of house coordinates (each has 20 users)
            allowed_antenna_types: List of allowed antenna types (None = all types allowed)
            optimization_mode: 'coverage' for target coverage with minimum cost, 'budget' for maximum coverage within constraints
            max_budget: Maximum budget constraint (used in budget mode)
            max_antennas: Maximum number of antennas constraint (used in budget mode)
        """
        self.width = width
        self.height = height
        self.target_coverage = target_coverage
        self.optimization_mode = optimization_mode
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
            f"mode={optimization_mode}, target_coverage={target_coverage}%, "
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

    def find_best_antenna_placement(self, need_capacity_only: bool = False, users_covered: int = 0) -> Tuple[Tuple[int, int], AntennaType, float] | None:
        """
        Find the best antenna placement considering cost efficiency and capacity waste.

        Args:
            need_capacity_only: If True, place antennas even if they don't cover new users
                              (used when coverage is met but capacity is insufficient)
            users_covered: Current number of users covered (for capacity optimization)

        Returns:
            Tuple of (position, antenna_type, cost_per_user) or None if no valid placement
        """
        best_position = None
        best_antenna_type = None
        # Lower is better (cost per new user)
        best_cost_efficiency = float('inf')
        best_capacity_waste = float('inf')

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

                    _, new_users = self.count_new_coverage(
                        x, y, spec.radius)

                    # If we need capacity only, allow placing anywhere valid
                    # Otherwise, only consider positions that cover new users
                    if need_capacity_only or new_users > 0:
                        # Calculate cost efficiency and capacity waste
                        if new_users > 0:
                            cost_efficiency = spec.cost / new_users
                        else:
                            # In capacity-only mode, choose antenna that minimizes capacity waste
                            total_capacity_current = sum(
                                ant["max_users"] for ant in self.placed_antennas)
                            remaining_capacity_needed = max(
                                0, users_covered - total_capacity_current)

                            # Prefer antenna size that matches remaining need
                            if remaining_capacity_needed > 0:
                                capacity_waste = abs(
                                    spec.max_users - remaining_capacity_needed)
                                cost_efficiency = spec.cost / spec.max_users
                            else:
                                cost_efficiency = spec.cost / spec.max_users
                                capacity_waste = spec.max_users

                        # Calculate capacity waste for this choice
                        if need_capacity_only:
                            total_capacity_with_new = sum(
                                ant["max_users"] for ant in self.placed_antennas) + spec.max_users
                            capacity_waste = total_capacity_with_new - users_covered
                        else:
                            capacity_waste = 0

                        # Prefer lower cost per user, then lower capacity waste
                        is_better = False
                        if need_capacity_only:
                            # In capacity mode, prioritize minimal waste
                            if capacity_waste < best_capacity_waste:
                                is_better = True
                            elif capacity_waste == best_capacity_waste and cost_efficiency < best_cost_efficiency:
                                is_better = True
                        else:
                            # In coverage mode, prioritize cost efficiency
                            if cost_efficiency < best_cost_efficiency:
                                is_better = True

                        if is_better:
                            best_cost_efficiency = cost_efficiency
                            best_capacity_waste = capacity_waste
                            best_position = (x, y)
                            best_antenna_type = antenna_type

        if best_position is None:
            return None

        return best_position, best_antenna_type, best_cost_efficiency

    def optimize(self) -> Dict:
        """
        Run the greedy algorithm with mode-specific optimization.

        Coverage mode: Iteratively place the most cost-efficient antenna until target coverage is reached.
        Budget mode: Maximize coverage within budget/antenna constraints.

        Returns:
            Dictionary with optimization results including antenna positions, coverage, and costs
        """
        # Pretty header
        print("\n" + "="*70)
        print(
            f"🚀 OPTIMIZATION STARTED - {self.optimization_mode.upper()} MODE")
        print("="*70)

        if self.optimization_mode == "coverage":
            print(f"📊 Target: {self.target_coverage}% user coverage")
            print(f"💰 Goal: Minimize cost while achieving target coverage")
        else:
            print(f"🎯 Goal: Maximize coverage within constraints")
            if self.max_budget:
                print(f"💵 Budget Limit: ${self.max_budget:,}")
            if self.max_antennas:
                print(f"📡 Antenna Limit: {self.max_antennas}")

        print(
            f"🏘️  Houses: {len(self.houses)} (Total users: {len(self.houses) * USERS_PER_HOUSE})")
        print(f"🗺️  Grid: {self.width}x{self.height}")
        print("="*70 + "\n")

        logger.info(
            f"Starting greedy algorithm in {self.optimization_mode} mode")

        total_users = len(self.houses) * USERS_PER_HOUSE
        target_users = (self.target_coverage / 100) * total_users

        iteration = 0
        max_iterations = self.width * self.height  # Prevent infinite loop

        while iteration < max_iterations:
            iteration += 1

            # Check if we've reached target coverage
            users_covered = len(self.covered_houses) * USERS_PER_HOUSE
            total_capacity = sum(ant["max_users"]
                                 for ant in self.placed_antennas)
            total_cost = sum(ant["cost"] for ant in self.placed_antennas)

            # Check stopping conditions based on mode
            if self.optimization_mode == "coverage":
                # Coverage mode: stop when target coverage and capacity are met
                coverage_met = users_covered >= target_users
                capacity_sufficient = total_capacity >= users_covered

                if coverage_met and capacity_sufficient:
                    print(f"\n✅ Target coverage achieved!")
                    break
            else:  # budget mode
                # Budget mode: stop when constraints are hit
                # Check if we've hit budget or antenna limit
                budget_exceeded = self.max_budget and total_cost >= self.max_budget
                antenna_limit_reached = self.max_antennas and len(
                    self.placed_antennas) >= self.max_antennas

                if budget_exceeded or antenna_limit_reached:
                    print(f"\n⚠️  Constraint reached!")
                    break

            # Find best antenna placement
            # In coverage mode: if coverage met but capacity insufficient, allow placing anywhere
            # In budget mode: always maximize new coverage
            need_capacity_only = (self.optimization_mode == "coverage" and
                                  users_covered >= target_users and
                                  total_capacity < users_covered)

            result = self.find_best_antenna_placement(
                need_capacity_only=need_capacity_only, users_covered=users_covered)

            if result is None:
                logger.warning(
                    f"Could not find valid position for new antenna. "
                    f"Placed {len(self.placed_antennas)} antennas. "
                    f"Achieved {users_covered}/{total_users} users, capacity: {total_capacity}"
                )
                print(f"\n⚠️  No more valid placements available")
                break

            position, antenna_type, _ = result
            spec = self.antenna_specs[antenna_type]

            # In budget mode, check if we can afford this antenna
            if self.optimization_mode == "budget":
                if self.max_budget and (total_cost + spec.cost) > self.max_budget:
                    logger.info(
                        f"Budget limit reached: ${total_cost} (next antenna would cost ${spec.cost})")
                    print(f"\n💰 Budget limit reached: ${total_cost:,}")
                    break
                if self.max_antennas and (len(self.placed_antennas) + 1) > self.max_antennas:
                    logger.info(
                        f"Antenna limit reached: {len(self.placed_antennas)}")
                    print(
                        f"\n📡 Antenna limit reached: {len(self.placed_antennas)}")
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

            # Pretty progress print every antenna
            antenna_emoji = {"Femto": "📱", "Pico": "📡",
                             "Micro": "🗼", "Macro": "🏗️"}
            emoji = antenna_emoji.get(antenna_type.value, "📡")

            print(f"{emoji} Antenna #{len(self.placed_antennas):2d}: {antenna_type.value:6s} @ ({position[0]:3d},{position[1]:3d}) "
                  f"| Cost: ${spec.cost:>6,} | Coverage: {current_coverage:5.1f}% ({users_covered}/{total_users} users) "
                  f"| Total: ${total_cost + spec.cost:>8,}")

            logger.debug(
                f"Placed {antenna_type.value} antenna #{len(self.placed_antennas)} at {position}, "
                f"cost: ${spec.cost}, new users: {len(new_houses) * USERS_PER_HOUSE}, "
                f"total coverage: {current_coverage:.1f}%, capacity: {total_capacity}"
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
        print(
            f"🔋 Capacity: {total_capacity:,} users ({capacity_utilization:.1f}% utilized)")
        print("="*70 + "\n")

        logger.info(
            f"Greedy algorithm complete ({self.optimization_mode} mode): "
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
