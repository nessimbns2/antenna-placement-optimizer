from typing import List, Tuple, Set, Dict
import logging
import random
from copy import deepcopy
from app.models import AntennaType, AntennaSpec

logger = logging.getLogger(__name__)

# Configuration constants
USERS_PER_HOUSE = 20
UNCOVERED_USER_PENALTY = 10.0
COST_DIVISOR = 1000

# Default parameters
DEFAULT_MAX_ITERATIONS = 100
DEFAULT_K_MAX = 3
MAX_INITIAL_ANTENNAS = 5


class VNSAlgorithm:
    """Variable Neighborhood Search (VNS) algorithm for antenna placement.

    VNS uses multiple neighborhood structures to escape local optima.
    At each iteration:
    1. Shake: Generate random neighbor using current neighborhood k
    2. Local Search: Apply hill climbing from the shaken solution
    3. Move or Not: If improved, reset k=1; else try next neighborhood k+1
    """

    def __init__(
        self,
        width: int,
        height: int,
        antenna_specs: Dict[AntennaType, AntennaSpec],
        houses: List[Tuple[int, int]],
        allowed_antenna_types: List[AntennaType] | None = None,
        max_budget: int | None = None,
        max_antennas: int | None = None,
        max_iterations: int = DEFAULT_MAX_ITERATIONS,
        k_max: int = DEFAULT_K_MAX,
        random_seed: int | None = None
    ):
        """
        Initialize the VNS algorithm.

        Args:
            width: Grid width
            height: Grid height
            antenna_specs: Dictionary of antenna specifications
            houses: List of house coordinates
            allowed_antenna_types: List of allowed antenna types
            max_budget: Maximum budget constraint
            max_antennas: Maximum number of antennas constraint
            max_iterations: Maximum VNS iterations
            k_max: Maximum neighborhood index (number of neighborhood structures)
            random_seed: Random seed for reproducibility
        """
        self.width = width
        self.height = height
        self.max_budget = max_budget
        self.max_antennas = max_antennas
        self.max_iterations = max_iterations
        self.k_max = k_max

        if random_seed is not None:
            random.seed(random_seed)

        if allowed_antenna_types:
            self.antenna_specs = {
                k: v for k, v in antenna_specs.items() if k in allowed_antenna_types}
        else:
            self.antenna_specs = antenna_specs

        self.houses = set(houses)
        self.total_users = len(houses) * USERS_PER_HOUSE

        logger.info(
            f"🔀 Initialized VNSAlgorithm: {width}x{height} grid, "
            f"max_iterations={max_iterations}, k_max={k_max}, "
            f"max_budget={max_budget}, max_antennas={max_antennas}"
        )

    def get_coverage_area(self, x: int, y: int, radius: int) -> Tuple[Set[Tuple[int, int]], Set[Tuple[int, int]]]:
        """Calculate coverage area for an antenna."""
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

    def calculate_objective(self, antennas: List[Dict]) -> float:
        """Calculate objective function (lower is better)."""
        if not antennas:
            return float('inf')

        covered_houses = set()
        total_cost = 0

        for ant in antennas:
            _, houses = self.get_coverage_area(
                ant["x"], ant["y"], ant["radius"])
            covered_houses.update(houses)
            total_cost += ant["cost"]

        users_covered = len(covered_houses) * USERS_PER_HOUSE
        uncovered_users = self.total_users - users_covered

        objective = total_cost + UNCOVERED_USER_PENALTY * COST_DIVISOR * uncovered_users

        if self.max_budget and total_cost > self.max_budget:
            objective += 100000 * \
                (total_cost - self.max_budget) / self.max_budget

        return objective

    def calculate_metrics(self, antennas: List[Dict]) -> Tuple[int, int, int]:
        """Calculate solution metrics (cost, users covered, cells covered)."""
        covered_cells = set()
        covered_houses = set()
        total_cost = 0

        for ant in antennas:
            cells, houses = self.get_coverage_area(
                ant["x"], ant["y"], ant["radius"])
            covered_cells.update(cells)
            covered_houses.update(houses)
            total_cost += ant["cost"]

        users_covered = len(covered_houses) * USERS_PER_HOUSE
        total_coverage = len(covered_cells) + len(covered_houses)
        return total_cost, users_covered, total_coverage

    def is_valid_position(self, x: int, y: int) -> bool:
        """Check if position is valid for antenna placement."""
        return 0 <= x < self.width and 0 <= y < self.height and (x, y) not in self.houses

    def antenna_covers_houses(self, x: int, y: int, radius: int) -> bool:
        """Check if antenna covers at least one house."""
        for hx, hy in self.houses:
            if (x - hx) ** 2 + (y - hy) ** 2 <= radius ** 2:
                return True
        return False

    def generate_initial_solution(self) -> List[Dict]:
        """Generate initial solution using greedy approach."""
        antennas = []
        max_initial = min(MAX_INITIAL_ANTENNAS,
                          self.max_antennas or MAX_INITIAL_ANTENNAS)
        house_list = list(self.houses)

        if not house_list:
            return antennas

        antenna_types = sorted(self.antenna_specs.keys(),
                               key=lambda t: self.antenna_specs[t].radius, reverse=True)
        placed = set()

        for _ in range(max_initial):
            target = random.choice(house_list)
            atype = random.choice(antenna_types)
            spec = self.antenna_specs[atype]

            for sr in range(spec.radius + 5):
                found = False
                for dx in range(-sr, sr + 1):
                    for dy in range(-sr, sr + 1):
                        x, y = target[0] + dx, target[1] + dy
                        if self.is_valid_position(x, y) and (x, y) not in placed:
                            antennas.append({
                                "x": x, "y": y, "type": atype,
                                "radius": spec.radius, "cost": spec.cost
                            })
                            placed.add((x, y))
                            found = True
                            break
                    if found:
                        break
                if found:
                    break
        return antennas

    def shake(self, solution: List[Dict], k: int) -> List[Dict]:
        """Shaking procedure - generate random neighbor at distance k.

        k=1: Single random move/add/remove/change
        k=2: Two random operations
        k=3: Three random operations (more exploration)
        """
        result = deepcopy(solution)

        for _ in range(k):
            if not result:
                # Add random antenna
                for _ in range(10):
                    x, y = random.randint(
                        0, self.width-1), random.randint(0, self.height-1)
                    if self.is_valid_position(x, y):
                        atype = random.choice(list(self.antenna_specs.keys()))
                        spec = self.antenna_specs[atype]
                        if self.antenna_covers_houses(x, y, spec.radius):
                            result.append({
                                "x": x, "y": y, "type": atype,
                                "radius": spec.radius, "cost": spec.cost
                            })
                            break
                continue

            operation = random.choice(["add", "remove", "move", "change"])
            occupied = {(a["x"], a["y"]) for a in result}
            current_cost = sum(a["cost"] for a in result)
            can_add = self.max_antennas is None or len(
                result) < self.max_antennas

            if operation == "add" and can_add:
                for _ in range(10):
                    x, y = random.randint(
                        0, self.width-1), random.randint(0, self.height-1)
                    if self.is_valid_position(x, y) and (x, y) not in occupied:
                        atype = random.choice(list(self.antenna_specs.keys()))
                        spec = self.antenna_specs[atype]
                        if self.max_budget and current_cost + spec.cost > self.max_budget:
                            continue
                        if self.antenna_covers_houses(x, y, spec.radius):
                            result.append({
                                "x": x, "y": y, "type": atype,
                                "radius": spec.radius, "cost": spec.cost
                            })
                            break

            elif operation == "remove" and len(result) > 1:
                idx = random.randint(0, len(result) - 1)
                result.pop(idx)

            elif operation == "move" and result:
                idx = random.randint(0, len(result) - 1)
                for _ in range(10):
                    x, y = random.randint(
                        0, self.width-1), random.randint(0, self.height-1)
                    if self.is_valid_position(x, y) and self.antenna_covers_houses(x, y, result[idx]["radius"]):
                        result[idx]["x"] = x
                        result[idx]["y"] = y
                        break

            elif operation == "change" and result:
                idx = random.randint(0, len(result) - 1)
                atype = random.choice(list(self.antenna_specs.keys()))
                spec = self.antenna_specs[atype]
                result[idx]["type"] = atype
                result[idx]["radius"] = spec.radius
                result[idx]["cost"] = spec.cost

        return result

    def local_search(self, solution: List[Dict], max_iters: int = 50) -> List[Dict]:
        """Simple hill climbing local search."""
        current = deepcopy(solution)
        current_obj = self.calculate_objective(current)

        for _ in range(max_iters):
            improved = False

            # Try all single moves
            for i in range(len(current)):
                # Try changing type
                for atype in self.antenna_specs.keys():
                    if atype != current[i]["type"]:
                        neighbor = deepcopy(current)
                        spec = self.antenna_specs[atype]
                        neighbor[i]["type"] = atype
                        neighbor[i]["radius"] = spec.radius
                        neighbor[i]["cost"] = spec.cost
                        obj = self.calculate_objective(neighbor)
                        if obj < current_obj:
                            current = neighbor
                            current_obj = obj
                            improved = True
                            break
                if improved:
                    break

            if not improved:
                break

        return current

    def remove_useless_antennas(self, antennas: List[Dict]) -> List[Dict]:
        """Remove antennas that don't cover any houses."""
        return [a for a in antennas if self.antenna_covers_houses(a["x"], a["y"], a["radius"])]

    def optimize(self) -> Dict:
        """Run the VNS optimization."""
        logger.info("🔀 Starting VNS optimization...")

        current = self.generate_initial_solution()
        current_obj = self.calculate_objective(current)

        best = deepcopy(current)
        best_obj = current_obj

        cost, users, _ = self.calculate_metrics(current)
        logger.info(
            f"📊 Initial: {len(current)} antennas, obj={current_obj:.2f}, users={users}")

        iteration = 0
        while iteration < self.max_iterations:
            k = 1
            while k <= self.k_max:
                iteration += 1
                if iteration > self.max_iterations:
                    break

                # Shaking
                shaken = self.shake(current, k)

                # Local search
                improved = self.local_search(shaken)
                improved_obj = self.calculate_objective(improved)

                # Move or not
                if improved_obj < current_obj:
                    current = improved
                    current_obj = improved_obj
                    k = 1  # Reset to first neighborhood

                    if current_obj < best_obj:
                        best = deepcopy(current)
                        best_obj = current_obj
                        logger.debug(
                            f"✨ New best at iter {iteration}: obj={best_obj:.2f}")
                else:
                    k += 1  # Try next neighborhood

            if iteration % 10 == 0:
                logger.info(
                    f"🔀 Iteration {iteration}: best_obj={best_obj:.2f}")

        # Cleanup
        best = self.remove_useless_antennas(best)

        # Final metrics
        if best:
            total_cost, users_covered, total_cells = self.calculate_metrics(
                best)
        else:
            total_cost, users_covered, total_cells = 0, 0, 0

        total_area = self.width * self.height
        coverage_percentage = (total_cells / total_area *
                               100) if total_area > 0 else 0
        user_coverage_percentage = (
            users_covered / self.total_users * 100) if self.total_users > 0 else 0

        logger.info(f"🏁 VNS complete: {len(best)} antennas")
        logger.info(f"💰 Total cost: ${total_cost:,}")
        logger.info(
            f"👥 Users: {users_covered}/{self.total_users} ({user_coverage_percentage:.2f}%)")

        return {
            "antennas": best,
            "coverage_percentage": coverage_percentage,
            "users_covered": users_covered,
            "total_users": self.total_users,
            "user_coverage_percentage": user_coverage_percentage,
            "total_cost": total_cost
        }
