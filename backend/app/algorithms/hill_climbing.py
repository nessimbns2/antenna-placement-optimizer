from typing import List, Tuple, Set, Dict
import logging
import random
from app.models import AntennaType, AntennaSpec

logger = logging.getLogger(__name__)

# Configuration constants
USERS_PER_HOUSE = 20  # Each house contains 20 users

# Energy function tuning parameters
UNCOVERED_USER_PENALTY = 10.0
COST_DIVISOR = 1000

# Default parameters
DEFAULT_MAX_ITERATIONS = 1000
MAX_INITIAL_ANTENNAS = 5


class HillClimbingAlgorithm:
    """Hill Climbing algorithm for antenna placement optimization.
    
    Hill Climbing is a simple local search algorithm that iteratively moves
    to the best neighboring solution. It stops when no better neighbor exists
    (reached a local optimum).
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
        random_seed: int | None = None
    ):
        """
        Initialize the Hill Climbing algorithm.

        Args:
            width: Grid width
            height: Grid height
            antenna_specs: Dictionary of antenna specifications
            houses: List of house coordinates (each has 20 users)
            allowed_antenna_types: List of allowed antenna types (None = all types allowed)
            max_budget: Maximum budget constraint (None = no limit)
            max_antennas: Maximum number of antennas constraint (None = no limit)
            max_iterations: Maximum iterations before stopping
            random_seed: Random seed for reproducibility (None = no seed)
        """
        self.width = width
        self.height = height
        self.max_budget = max_budget
        self.max_antennas = max_antennas
        self.max_iterations = max_iterations

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
            f"⛰️ Initialized HillClimbingAlgorithm: {width}x{height} grid, "
            f"max_iterations={max_iterations}, "
            f"max_budget={max_budget}, max_antennas={max_antennas}, {len(houses)} houses"
        )

    def get_coverage_area(self, x: int, y: int, radius: int) -> Tuple[Set[Tuple[int, int]], Set[Tuple[int, int]]]:
        """Calculate the coverage area for an antenna."""
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

    def calculate_solution_metrics(self, antennas: List[Dict]) -> Tuple[float, int, int, int]:
        """Calculate metrics for a solution. Lower energy is better."""
        covered_cells = set()
        covered_houses = set()
        total_cost = 0

        for antenna in antennas:
            cells, houses = self.get_coverage_area(
                antenna["x"], antenna["y"], antenna["radius"]
            )
            covered_cells.update(cells)
            covered_houses.update(houses)
            total_cost += antenna["cost"]

        users_covered = len(covered_houses) * USERS_PER_HOUSE
        uncovered_users = self.total_users - users_covered if self.total_users > 0 else 0

        uncovered_penalty = uncovered_users * UNCOVERED_USER_PENALTY
        cost_penalty = total_cost / COST_DIVISOR if total_cost > 0 else 0
        energy = uncovered_penalty + cost_penalty

        if self.max_budget is not None and total_cost > self.max_budget:
            energy += 100.0 * (total_cost - self.max_budget) / self.max_budget

        total_coverage = len(covered_cells) + len(covered_houses)
        return energy, total_cost, users_covered, total_coverage

    def is_valid_position(self, x: int, y: int) -> bool:
        """Check if a position is valid for antenna placement."""
        return (0 <= x < self.width and
                0 <= y < self.height and
                (x, y) not in self.houses)

    def antenna_covers_houses(self, x: int, y: int, radius: int) -> bool:
        """Check if an antenna covers at least one house."""
        for house in self.houses:
            hx, hy = house
            if (x - hx) ** 2 + (y - hy) ** 2 <= radius ** 2:
                return True
        return False

    def generate_initial_solution(self) -> List[Dict]:
        """Generate an initial solution."""
        antennas = []
        max_initial = min(MAX_INITIAL_ANTENNAS, self.max_antennas or MAX_INITIAL_ANTENNAS)
        house_list = list(self.houses)
        
        if not house_list:
            return antennas

        antenna_types = list(self.antenna_specs.keys())
        antenna_types.sort(key=lambda t: self.antenna_specs[t].radius, reverse=True)
        placed_positions = set()

        for _ in range(max_initial):
            target_house = random.choice(house_list)
            antenna_type = random.choice(antenna_types)
            spec = self.antenna_specs[antenna_type]

            # Find valid position near house
            for search_radius in range(0, spec.radius + 5):
                found = False
                for dx in range(-search_radius, search_radius + 1):
                    for dy in range(-search_radius, search_radius + 1):
                        x, y = target_house[0] + dx, target_house[1] + dy
                        if self.is_valid_position(x, y) and (x, y) not in placed_positions:
                            antennas.append({
                                "x": x, "y": y,
                                "type": antenna_type,
                                "radius": spec.radius,
                                "cost": spec.cost
                            })
                            placed_positions.add((x, y))
                            found = True
                            break
                    if found:
                        break
                if found:
                    break

        return antennas

    def get_best_neighbor(self, current_solution: List[Dict]) -> Tuple[List[Dict] | None, float]:
        """Find the best neighbor of the current solution."""
        best_neighbor = None
        best_energy = float('inf')

        occupied = {(ant['x'], ant['y']) for ant in current_solution}
        current_cost = sum(ant['cost'] for ant in current_solution)
        can_add = self.max_antennas is None or len(current_solution) < self.max_antennas

        # Try adding antennas
        if can_add:
            for _ in range(20):  # Sample 20 random positions
                x, y = random.randint(0, self.width - 1), random.randint(0, self.height - 1)
                if not self.is_valid_position(x, y) or (x, y) in occupied:
                    continue
                for atype, spec in self.antenna_specs.items():
                    if self.max_budget and current_cost + spec.cost > self.max_budget:
                        continue
                    if not self.antenna_covers_houses(x, y, spec.radius):
                        continue
                    neighbor = [ant.copy() for ant in current_solution]
                    neighbor.append({"x": x, "y": y, "type": atype, "radius": spec.radius, "cost": spec.cost})
                    energy, _, _, _ = self.calculate_solution_metrics(neighbor)
                    if energy < best_energy:
                        best_energy = energy
                        best_neighbor = neighbor

        # Try removing antennas
        if len(current_solution) > 1:
            for i in range(len(current_solution)):
                neighbor = [ant.copy() for j, ant in enumerate(current_solution) if j != i]
                energy, _, _, _ = self.calculate_solution_metrics(neighbor)
                if energy < best_energy:
                    best_energy = energy
                    best_neighbor = neighbor

        # Try moving antennas
        for i in range(len(current_solution)):
            for _ in range(5):
                x, y = random.randint(0, self.width - 1), random.randint(0, self.height - 1)
                if not self.is_valid_position(x, y):
                    continue
                if not self.antenna_covers_houses(x, y, current_solution[i]["radius"]):
                    continue
                neighbor = [ant.copy() for ant in current_solution]
                neighbor[i]["x"] = x
                neighbor[i]["y"] = y
                energy, _, _, _ = self.calculate_solution_metrics(neighbor)
                if energy < best_energy:
                    best_energy = energy
                    best_neighbor = neighbor

        # Try changing antenna types
        for i in range(len(current_solution)):
            for atype, spec in self.antenna_specs.items():
                if atype == current_solution[i]["type"]:
                    continue
                neighbor = [ant.copy() for ant in current_solution]
                neighbor[i]["type"] = atype
                neighbor[i]["radius"] = spec.radius
                neighbor[i]["cost"] = spec.cost
                energy, _, _, _ = self.calculate_solution_metrics(neighbor)
                if energy < best_energy:
                    best_energy = energy
                    best_neighbor = neighbor

        return best_neighbor, best_energy

    def remove_useless_antennas(self, antennas: List[Dict]) -> List[Dict]:
        """Remove antennas that don't cover any houses."""
        return [ant for ant in antennas if self.antenna_covers_houses(ant["x"], ant["y"], ant["radius"])]

    def optimize(self) -> Dict:
        """Run the Hill Climbing optimization."""
        logger.info("⛰️ Starting Hill Climbing optimization...")

        current_solution = self.generate_initial_solution()
        current_energy, current_cost, current_users, _ = self.calculate_solution_metrics(current_solution)

        logger.info(
            f"📊 Initial: {len(current_solution)} antennas, "
            f"energy={current_energy:.4f}, users={current_users}, cost=${current_cost}"
        )

        iteration = 0
        while iteration < self.max_iterations:
            iteration += 1

            best_neighbor, best_energy = self.get_best_neighbor(current_solution)

            if best_neighbor is None or best_energy >= current_energy:
                logger.info(f"⛰️ Local optimum reached at iteration {iteration}")
                break

            current_solution = best_neighbor
            current_energy = best_energy

            if iteration % 50 == 0:
                _, cost, users, _ = self.calculate_solution_metrics(current_solution)
                logger.info(f"⛰️ Iteration {iteration}: energy={current_energy:.4f}, users={users}")

        # Cleanup
        current_solution = self.remove_useless_antennas(current_solution)

        # Final metrics
        if current_solution:
            _, total_cost, users_covered, total_cells_covered = self.calculate_solution_metrics(current_solution)
        else:
            total_cost, users_covered, total_cells_covered = 0, 0, 0

        total_cells = self.width * self.height
        coverage_percentage = (total_cells_covered / total_cells * 100) if total_cells > 0 else 0
        user_coverage_percentage = (users_covered / self.total_users * 100) if self.total_users > 0 else 0

        logger.info(f"🏁 Hill Climbing complete: {len(current_solution)} antennas")
        logger.info(f"💰 Total cost: ${total_cost:,}")
        logger.info(f"👥 Users: {users_covered}/{self.total_users} ({user_coverage_percentage:.2f}%)")

        return {
            "antennas": current_solution,
            "coverage_percentage": coverage_percentage,
            "users_covered": users_covered,
            "total_users": self.total_users,
            "user_coverage_percentage": user_coverage_percentage,
            "total_cost": total_cost
        }
