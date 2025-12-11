from typing import List, Tuple, Set, Dict
import logging
import random
import math
from app.models import AntennaType, AntennaSpec

logger = logging.getLogger(__name__)

# Configuration constants
USERS_PER_HOUSE = 20  # Each house contains 20 users

# Energy function tuning parameters
UNCOVERED_USER_PENALTY = 10.0
COST_DIVISOR = 1000

# Neighbor generation operation weights
OPERATION_WEIGHT_ADD = 30
OPERATION_WEIGHT_REMOVE = 30
OPERATION_WEIGHT_MOVE = 25
OPERATION_WEIGHT_CHANGE_TYPE = 15

# Default parameters
DEFAULT_ITERATIONS = 100
DEFAULT_TABU_SIZE = 20
MAX_INITIAL_ANTENNAS = 5


class TabuSearchAlgorithm:
    """Tabu Search algorithm for antenna placement optimization.
    
    Tabu Search maintains a list of recently visited solutions (tabu list)
    to avoid cycling and explore new areas of the solution space.
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
        iterations: int = DEFAULT_ITERATIONS,
        tabu_size: int = DEFAULT_TABU_SIZE,
        random_seed: int | None = None
    ):
        """
        Initialize the Tabu Search algorithm.

        Args:
            width: Grid width
            height: Grid height
            antenna_specs: Dictionary of antenna specifications
            houses: List of house coordinates (each has 20 users)
            allowed_antenna_types: List of allowed antenna types (None = all types allowed)
            max_budget: Maximum budget constraint (None = no limit)
            max_antennas: Maximum number of antennas constraint (None = no limit)
            iterations: Number of iterations to run
            tabu_size: Maximum size of tabu list
            random_seed: Random seed for reproducibility (None = no seed)
        """
        self.width = width
        self.height = height
        self.max_budget = max_budget
        self.max_antennas = max_antennas
        self.iterations = iterations
        self.tabu_size = tabu_size

        # Set random seed for reproducibility
        if random_seed is not None:
            random.seed(random_seed)

        # Filter antenna specs by allowed types
        if allowed_antenna_types:
            self.antenna_specs = {
                k: v for k, v in antenna_specs.items() if k in allowed_antenna_types}
        else:
            self.antenna_specs = antenna_specs

        self.houses = set(houses)
        self.total_users = len(houses) * USERS_PER_HOUSE

        logger.info(
            f"🔍 Initialized TabuSearchAlgorithm: {width}x{height} grid, "
            f"iterations={iterations}, tabu_size={tabu_size}, "
            f"max_budget={max_budget}, max_antennas={max_antennas}, {len(houses)} houses"
        )

    def get_coverage_area(self, x: int, y: int, radius: int) -> Tuple[Set[Tuple[int, int]], Set[Tuple[int, int]]]:
        """Calculate the coverage area for an antenna at position (x, y) with given radius."""
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
        """Calculate metrics for a solution."""
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

        if self.total_users > 0:
            uncovered_users = self.total_users - users_covered
        else:
            uncovered_users = 0

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
        """Check if an antenna at (x, y) with given radius covers at least one house."""
        for house in self.houses:
            hx, hy = house
            dist_sq = (x - hx) * (x - hx) + (y - hy) * (y - hy)
            if dist_sq <= radius * radius:
                return True
        return False

    def generate_initial_solution(self) -> List[Dict]:
        """Generate an initial solution by placing antennas near houses."""
        antennas = []
        max_initial = min(
            MAX_INITIAL_ANTENNAS, self.max_antennas if self.max_antennas else MAX_INITIAL_ANTENNAS)

        house_list = list(self.houses)
        if not house_list:
            return antennas

        antenna_types = list(self.antenna_specs.keys())
        antenna_types.sort(key=lambda t: self.antenna_specs[t].radius, reverse=True)
        placed_positions = set()

        attempts = 0
        max_attempts = max_initial * 10

        while len(antennas) < max_initial and attempts < max_attempts:
            attempts += 1
            target_house = random.choice(house_list)

            if random.random() < 0.5 and len(antenna_types) > 0:
                antenna_type = antenna_types[0]
            else:
                antenna_type = random.choice(antenna_types)

            spec = self.antenna_specs[antenna_type]

            for search_radius in range(0, min(spec.radius + 5, max(self.width, self.height))):
                candidates = []
                for dx in range(-search_radius, search_radius + 1):
                    for dy in range(-search_radius, search_radius + 1):
                        dist_sq = dx * dx + dy * dy
                        if search_radius * search_radius <= dist_sq <= (search_radius + 1) * (search_radius + 1):
                            x, y = target_house[0] + dx, target_house[1] + dy
                            if self.is_valid_position(x, y) and (x, y) not in placed_positions:
                                candidates.append((x, y))

                if candidates:
                    x, y = random.choice(candidates)
                    antenna = {
                        "x": x, "y": y,
                        "type": antenna_type,
                        "radius": spec.radius,
                        "cost": spec.cost
                    }
                    antennas.append(antenna)
                    placed_positions.add((x, y))
                    break

        return antennas

    def solution_to_tuple(self, solution: List[Dict]) -> tuple:
        """Convert solution to a hashable tuple for tabu list."""
        return tuple(sorted(
            (ant["x"], ant["y"], ant["type"].value if hasattr(ant["type"], 'value') else str(ant["type"]))
            for ant in solution
        ))

    def generate_neighbors(self, current_solution: List[Dict]) -> List[List[Dict]]:
        """Generate all neighbors of the current solution."""
        neighbors = []

        if not current_solution:
            return [self.generate_initial_solution()[:1]]

        occupied_positions = {(ant['x'], ant['y']) for ant in current_solution}
        current_cost = sum(ant['cost'] for ant in current_solution)
        can_add = self.max_antennas is None or len(current_solution) < self.max_antennas

        # Add antenna
        if can_add:
            for _ in range(10):  # Try 10 random add positions
                x = random.randint(0, self.width - 1)
                y = random.randint(0, self.height - 1)
                if self.is_valid_position(x, y) and (x, y) not in occupied_positions:
                    for antenna_type in self.antenna_specs.keys():
                        spec = self.antenna_specs[antenna_type]
                        if self.max_budget and current_cost + spec.cost > self.max_budget:
                            continue
                        if self.antenna_covers_houses(x, y, spec.radius):
                            new_solution = [ant.copy() for ant in current_solution]
                            new_solution.append({
                                "x": x, "y": y,
                                "type": antenna_type,
                                "radius": spec.radius,
                                "cost": spec.cost
                            })
                            neighbors.append(new_solution)

        # Remove antenna
        if len(current_solution) > 1:
            for i in range(len(current_solution)):
                new_solution = [ant.copy() for j, ant in enumerate(current_solution) if j != i]
                neighbors.append(new_solution)

        # Move antenna
        for i in range(len(current_solution)):
            for _ in range(5):  # Try 5 random moves per antenna
                x = random.randint(0, self.width - 1)
                y = random.randint(0, self.height - 1)
                if self.is_valid_position(x, y) and self.antenna_covers_houses(x, y, current_solution[i]["radius"]):
                    new_solution = [ant.copy() for ant in current_solution]
                    new_solution[i]["x"] = x
                    new_solution[i]["y"] = y
                    neighbors.append(new_solution)

        # Change type
        for i in range(len(current_solution)):
            for antenna_type in self.antenna_specs.keys():
                if antenna_type != current_solution[i]["type"]:
                    spec = self.antenna_specs[antenna_type]
                    new_solution = [ant.copy() for ant in current_solution]
                    new_solution[i]["type"] = antenna_type
                    new_solution[i]["radius"] = spec.radius
                    new_solution[i]["cost"] = spec.cost
                    neighbors.append(new_solution)

        return neighbors

    def remove_useless_antennas(self, antennas: List[Dict]) -> List[Dict]:
        """Remove antennas that don't cover any houses."""
        useful = []
        for antenna in antennas:
            if self.antenna_covers_houses(antenna["x"], antenna["y"], antenna["radius"]):
                useful.append(antenna)
        return useful

    def optimize(self) -> Dict:
        """Run the Tabu Search optimization."""
        logger.info("🔍 Starting Tabu Search optimization...")

        current_solution = self.generate_initial_solution()
        current_energy, current_cost, current_users, _ = self.calculate_solution_metrics(current_solution)

        best_solution = [ant.copy() for ant in current_solution]
        best_energy = current_energy

        tabu_list = []

        logger.info(
            f"📊 Initial solution: {len(current_solution)} antennas, "
            f"energy={current_energy:.4f}, users={current_users}, cost=${current_cost}"
        )

        for iteration in range(self.iterations):
            neighbors = self.generate_neighbors(current_solution)
            
            # Filter out tabu neighbors (unless aspiration criterion met)
            valid_neighbors = []
            for neighbor in neighbors:
                neighbor_tuple = self.solution_to_tuple(neighbor)
                neighbor_energy, _, _, _ = self.calculate_solution_metrics(neighbor)
                
                # Aspiration criterion: accept tabu move if it improves best solution
                if neighbor_tuple not in tabu_list or neighbor_energy < best_energy:
                    valid_neighbors.append((neighbor, neighbor_energy))

            if not valid_neighbors:
                logger.info(f"⏹️ No valid neighbors at iteration {iteration}")
                break

            # Select best neighbor
            valid_neighbors.sort(key=lambda x: x[1])
            next_solution, next_energy = valid_neighbors[0]

            # Update tabu list
            tabu_list.append(self.solution_to_tuple(current_solution))
            if len(tabu_list) > self.tabu_size:
                tabu_list.pop(0)

            current_solution = next_solution
            current_energy = next_energy

            # Update best solution
            if current_energy < best_energy:
                best_solution = [ant.copy() for ant in current_solution]
                best_energy = current_energy
                _, best_cost, best_users, _ = self.calculate_solution_metrics(best_solution)
                logger.debug(
                    f"✨ New best at iteration {iteration}: "
                    f"{len(best_solution)} antennas, energy={best_energy:.4f}"
                )

            if iteration % 20 == 0:
                logger.info(f"🔍 Iteration {iteration}: best_energy={best_energy:.4f}")

        # Cleanup
        best_solution = self.remove_useless_antennas(best_solution)

        # Calculate final metrics
        if best_solution:
            _, best_cost, best_users, best_cells = self.calculate_solution_metrics(best_solution)
        else:
            best_cost, best_users, best_cells = 0, 0, 0

        total_cells = self.width * self.height
        coverage_percentage = (best_cells / total_cells * 100) if total_cells > 0 else 0
        user_coverage_percentage = (best_users / self.total_users * 100) if self.total_users > 0 else 0

        logger.info(f"🏁 Tabu Search complete: {len(best_solution)} antennas placed")
        logger.info(f"💰 Total cost: ${best_cost:,}")
        logger.info(f"👥 Users covered: {best_users}/{self.total_users} ({user_coverage_percentage:.2f}%)")

        return {
            "antennas": best_solution,
            "coverage_percentage": coverage_percentage,
            "users_covered": best_users,
            "total_users": self.total_users,
            "user_coverage_percentage": user_coverage_percentage,
            "total_cost": best_cost
        }
