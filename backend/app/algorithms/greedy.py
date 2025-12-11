from typing import List, Tuple, Set, Dict, Optional
import heapq
import itertools
import logging
from app.models import AntennaType, AntennaSpec

logger = logging.getLogger(__name__)

USERS_PER_HOUSE = 20  # Each house contains 20 users


class GreedyAlgorithm:
    """Greedy algorithm for antenna placement using score-based optimization.
    Improved: candidate generation + heap with lazy updates to avoid scanning entire grid
    every iteration. Same public API as original class (optimize(), find_best_antenna_placement()).
    """

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

        # --- New precomputation: offsets_by_radius and candidate generation ---
        # Precompute circle offsets for each radius once
        self.offsets_by_radius: Dict[int, List[Tuple[int, int]]] = {}
        for spec in self.antenna_specs.values():
            r = spec.radius
            if r not in self.offsets_by_radius:
                offs = []
                rr = r * r
                for dx in range(-r, r + 1):
                    for dy in range(-r, r + 1):
                        if dx * dx + dy * dy <= rr:
                            offs.append((dx, dy))
                self.offsets_by_radius[r] = offs

        # Build candidates: map (cx, cy, antenna_type) -> set(houses it would cover)
        self.candidates_houses: Dict[Tuple[int, int, AntennaType], Set[Tuple[int, int]]] = {}
        for (hx, hy) in self.houses:
            for antenna_type, spec in self.antenna_specs.items():
                offs = self.offsets_by_radius[spec.radius]
                for dx, dy in offs:
                    cx, cy = hx - dx, hy - dy
                    # Candidate center must be inside grid and not a house
                    if 0 <= cx < self.width and 0 <= cy < self.height and (cx, cy) not in self.houses:
                        key = (cx, cy, antenna_type)
                        if key not in self.candidates_houses:
                            self.candidates_houses[key] = set()
                        self.candidates_houses[key].add((hx, hy))

        # Build initial heap of candidates with initial scores
        # Heap entries: (-score, counter, key)
        self.heap: List[Tuple[float, int, Tuple[int, int, AntennaType]]] = []
        self._counter = itertools.count()
        for key, houses_set in self.candidates_houses.items():
            antenna_type = key[2]
            cost = self.antenna_specs[antenna_type].cost
            new_users = len(houses_set) * USERS_PER_HOUSE
            score = new_users / cost if cost > 0 and new_users > 0 else -1.0
            if score > 0:
                heapq.heappush(self.heap, (-score, next(self._counter), key))

        logger.info(
            f"Initialized GreedyAlgorithm: {width}x{height} grid, "
            f"max_budget={max_budget}, max_antennas={max_antennas}, {len(houses)} houses, "
            f"{len(self.candidates_houses)} candidates, heap_size={len(self.heap)}"
        )

    # Keep your get_coverage_area and count_new_coverage methods (unchanged)
    def get_coverage_area(self, x: int, y: int, radius: int) -> Tuple[Set[Tuple[int, int]], Set[Tuple[int, int]]]:
        covered_cells = set()
        covered_houses = set()
        for dx in range(-radius, radius + 1):
            for dy in range(-radius, radius + 1):
                if dx * dx + dy * dy <= radius * radius:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < self.width and 0 <= ny < self.height:
                        if (nx, ny) in self.houses:
                            covered_houses.add((nx, ny))
                        else:
                            covered_cells.add((nx, ny))
        return covered_cells, covered_houses

    def count_new_coverage(self, x: int, y: int, radius: int) -> Tuple[int, int]:
        cells, houses = self.get_coverage_area(x, y, radius)
        new_cells = cells - self.covered_cells
        new_houses = houses - self.covered_houses
        new_users = len(new_houses) * USERS_PER_HOUSE
        return len(new_cells), new_users

    def is_valid_position(self, x: int, y: int) -> bool:
        return (0 <= x < self.width and
                0 <= y < self.height and
                (x, y) not in self.houses)

    def antenna_covers_houses(self, x: int, y: int, radius: int) -> bool:
        # Keep a quick check; used in cleanup or edge cases
        for house in self.houses:
            hx, hy = house
            dist_sq = (x - hx) * (x - hx) + (y - hy) * (y - hy)
            if dist_sq <= radius * radius:
                return True
        return False

    def calculate_score(self, new_users: int, cost: int) -> float:
        if cost == 0:
            return 0
        if new_users == 0:
            return -1.0
        return new_users / cost

    def find_best_antenna_placement(self) -> Tuple[Tuple[int, int], AntennaType, float] | None:
        """
        New implementation: use the precomputed heap of candidates and lazy updates.
        Pops candidates until a valid current-best placement is found (or heap empties).
        Returns (position, antenna_type, score) or None.
        """
        # Pop from heap until we find a valid placement or heap empties
        while self.heap:
            neg_score, _, key = heapq.heappop(self.heap)
            cx, cy, antenna_type = key

            # Skip if we already placed an antenna at this exact position
            if any(ant['x'] == cx and ant['y'] == cy for ant in self.placed_antennas):
                continue

            # Candidate's houses (precomputed)
            candidate_houses = self.candidates_houses.get(key)
            if not candidate_houses:
                continue

            # Compute actual uncovered houses for this candidate right now
            uncovered = candidate_houses - self.covered_houses
            new_users = len(uncovered) * USERS_PER_HOUSE
            cost = self.antenna_specs[antenna_type].cost
            score_now = self.calculate_score(new_users=new_users, cost=cost)

            # If score is non-positive, skip permanently (no benefit)
            if score_now <= 0:
                continue

            # If the popped score was stale (different), push updated and continue
            if -neg_score != score_now:
                heapq.heappush(self.heap, (-score_now, next(self._counter), key))
                continue

            # Final checks: position still valid (within grid and not a house)
            if not self.is_valid_position(cx, cy):
                continue

            # This candidate is the current best — return it for placement
            return ( (cx, cy), antenna_type, score_now )

        # Heap exhausted or no valid candidate
        return None

    def remove_useless_antennas(self, antennas: List[Dict]) -> List[Dict]:
        useful_antennas = []
        removed_count = 0

        for antenna in antennas:
            if self.antenna_covers_houses(antenna["x"], antenna["y"], antenna["radius"]):
                useful_antennas.append(antenna)
            else:
                removed_count += 1
                logger.debug(
                    f"🗑️ Removed useless antenna at ({antenna['x']}, {antenna['y']}) "
                    f"type={antenna['type']} - covers no houses"
                )

        if removed_count > 0:
            logger.info(
                f"🧹 Cleanup: Removed {removed_count} useless antenna(s)")

        return useful_antennas

    def optimize(self) -> Dict:
        # All logic kept same as before; no change required here except it now
        # benefits from optimized find_best_antenna_placement
        print("\n" + "="*70)
        print(f"🚀 SCORE-BASED GREEDY OPTIMIZATION (optimized candidates + heap)")
        print("="*70)
        print(
            f"🏘️  Houses: {len(self.houses)} (Total users: {len(self.houses) * USERS_PER_HOUSE})")
        print(f"🗺️  Grid: {self.width}x{self.height}")
        print(f"📐 Score Formula: New Users Covered / Cost")

        if self.max_budget:
            print(f"💵 Budget Limit: ${self.max_budget:,}")
        if self.max_antennas:
            print(f"📡 Antenna Limit: {self.max_antennas}")
        if not self.max_budget and not self.max_antennas:
            print(f"⚠️  No constraints set")

        print("="*70 + "\n")

        logger.info(f"Starting score-based greedy algorithm (optimized)")

        total_users = len(self.houses) * USERS_PER_HOUSE
        iteration = 0
        max_iterations = max(1, self.width * self.height)  # safety cap

        while iteration < max_iterations:
            iteration += 1

            total_cost = sum(ant["cost"] for ant in self.placed_antennas)
            num_antennas = len(self.placed_antennas)

            if self.max_antennas and num_antennas >= self.max_antennas:
                print(f"\n📡 Antenna limit reached: {num_antennas}")
                break

            if self.max_budget and total_cost >= self.max_budget:
                print(f"\n💰 Budget limit reached: ${total_cost:,}")
                break

            result = self.find_best_antenna_placement()

            if result is None:
                users_covered = len(self.covered_houses) * USERS_PER_HOUSE
                logger.warning(
                    f"Could not find valid position for new antenna. "
                    f"Placed {num_antennas} antennas. "
                    f"Achieved {users_covered}/{total_users} users"
                )
                print(f"\n⚠️  No more valid placements available")
                break

            position, antenna_type, score = result
            spec = self.antenna_specs[antenna_type]

            if score <= 0:
                logger.info(
                    f"Best available antenna has non-positive score ({score:.4f}). "
                    f"Stopping optimization to avoid wasteful placements."
                )
                print(
                    f"\n✋ Stopped: Best score is {score:.4f} (no value added)")
                break

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
                "cost": spec.cost
            }
            self.placed_antennas.append(antenna_data)

            # Update coverage (houses + cells)
            _, houses = self.get_coverage_area(position[0], position[1], spec.radius)
            new_houses = houses - self.covered_houses
            self.covered_houses.update(houses)
            cells, _ = self.get_coverage_area(position[0], position[1], spec.radius)
            self.covered_cells.update(cells)

            users_covered = len(self.covered_houses) * USERS_PER_HOUSE
            current_coverage = (users_covered / total_users *
                                100) if total_users > 0 else 0
            new_cost = total_cost + spec.cost

            antenna_emoji = {"Femto": "📱", "Pico": "📡",
                             "Micro": "🗼", "Macro": "🏗️"}
            emoji = antenna_emoji.get(antenna_type.value, "📡")

            print(f"{emoji} Antenna #{len(self.placed_antennas):2d}: {antenna_type.value:6s} @ ({position[0]:3d},{position[1]:3d}) "
                  f"| Score: {score:7.4f} | Cost: ${spec.cost:>6,} | Coverage: {current_coverage:5.1f}% | Total: ${new_cost:>8,}")

            logger.debug(
                f"Placed {antenna_type.value} antenna #{len(self.placed_antennas)} at {position}, "
                f"score: {score:.2f}, cost: ${spec.cost}, new users: {len(new_houses) * USERS_PER_HOUSE}, "
                f"total coverage: {current_coverage:.1f}%"
            )

        # Final stats (same as before)
        total_cells = self.width * self.height - len(self.houses)
        coverage_percentage = (len(self.covered_cells) / total_cells * 100) if total_cells > 0 else 0

        users_covered = len(self.covered_houses) * USERS_PER_HOUSE
        user_coverage_percentage = (
            users_covered / total_users * 100) if total_users > 0 else 0

        total_cost = sum(ant["cost"] for ant in self.placed_antennas)

        print("\n" + "="*70)
        print("✨ OPTIMIZATION COMPLETE")
        print("="*70)
        print(f"📡 Antennas Placed: {len(self.placed_antennas)}")
        print(f"💰 Total Cost: ${total_cost:,}")
        print(
            f"👥 Users Covered: {users_covered}/{total_users} ({user_coverage_percentage:.2f}%)")
        print(f"📊 Area Coverage: {coverage_percentage:.2f}%")
        print("="*70 + "\n")

        logger.info(
            f"Score-based greedy algorithm complete: "
            f"{len(self.placed_antennas)} antennas placed, "
            f"total cost: ${total_cost}, "
            f"{coverage_percentage:.2f}% area coverage, "
            f"{users_covered}/{total_users} users covered ({user_coverage_percentage:.2f}%)"
        )

        # Cleanup remains the same
        original_count = len(self.placed_antennas)
        self.placed_antennas = self.remove_useless_antennas(
            self.placed_antennas)

        if len(self.placed_antennas) < original_count:
            total_cost = sum(ant["cost"] for ant in self.placed_antennas)
            users_covered = len(self.covered_houses) * USERS_PER_HOUSE
            total_coverage = len(self.covered_cells) + len(self.covered_houses)
            coverage_percentage = (total_coverage / (self.width * self.height)
                                   * 100) if (self.width * self.height) > 0 else 0
            user_coverage_percentage = (
                users_covered / total_users * 100) if total_users > 0 else 0

        return {
            "antennas": self.placed_antennas,
            "coverage_percentage": coverage_percentage,
            "users_covered": users_covered,
            "total_users": total_users,
            "user_coverage_percentage": user_coverage_percentage,
            "total_cost": total_cost
        }
