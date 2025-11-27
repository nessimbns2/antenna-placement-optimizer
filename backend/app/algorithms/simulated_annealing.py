from typing import List, Tuple, Set, Dict
import logging
import random
import math
from app.models import AntennaType, AntennaSpec

logger = logging.getLogger(__name__)

# Configuration constants
USERS_PER_HOUSE = 20  # Each house contains 20 users

# Energy function tuning parameters
# These control the trade-off between coverage and cost optimization
# Penalty per uncovered user (higher = prioritize coverage more)
UNCOVERED_USER_PENALTY = 10.0
# Cost normalization factor (lower = prioritize cost reduction more)
COST_DIVISOR = 5000
# Cost optimization levels:
#   - 100000: Light cost optimization (~$250-300k solutions)
#   - 50000:  Moderate cost optimization (~$180-250k solutions)
#   - 25000:  Strong cost optimization (~$150-200k solutions)
#   - 10000:  Very aggressive cost optimization (~$100-150k solutions)
#   - 5000:   Extreme cost optimization (may sacrifice some efficiency)

# Neighbor generation operation weights
# Controls how the algorithm explores the solution space
OPERATION_WEIGHT_ADD = 30        # Weight for adding new antennas
# Weight for removing antennas (balanced with add)
OPERATION_WEIGHT_REMOVE = 30
OPERATION_WEIGHT_MOVE = 25       # Weight for moving existing antennas
OPERATION_WEIGHT_CHANGE_TYPE = 15  # Weight for changing antenna types

# Initial solution generation parameters
# Probability of choosing largest antenna type (0.0-1.0)
INITIAL_LARGE_ANTENNA_BIAS = 0.4
# Maximum number of antennas in initial solution
MAX_INITIAL_ANTENNAS = 10

# Convergence and stopping criteria
# Stop optimization if no improvement after this many iterations (prevents wasted computation)
DEFAULT_EARLY_STOPPING_ITERATIONS = 5000


class SimulatedAnnealingAlgorithm:
    """Simulated Annealing algorithm for antenna placement optimization."""

    def __init__(
        self,
        width: int,
        height: int,
        antenna_specs: Dict[AntennaType, AntennaSpec],
        houses: List[Tuple[int, int]],
        allowed_antenna_types: List[AntennaType] | None = None,
        max_budget: int | None = None,
        max_antennas: int | None = None,
        initial_temperature: float = 100.0,
        cooling_rate: float = 0.95,
        min_temperature: float = 0.1,
        iterations_per_temp: int = 100,
        random_seed: int | None = None,
        early_stopping_iterations: int | None = DEFAULT_EARLY_STOPPING_ITERATIONS
    ):
        """
        Initialize the simulated annealing algorithm.

        Args:
            width: Grid width
            height: Grid height
            antenna_specs: Dictionary of antenna specifications
            houses: List of house coordinates (each has 20 users)
            allowed_antenna_types: List of allowed antenna types (None = all types allowed)
            max_budget: Maximum budget constraint (None = no limit)
            max_antennas: Maximum number of antennas constraint (None = no limit)
            initial_temperature: Starting temperature for annealing
            cooling_rate: Rate at which temperature decreases (0 < rate < 1)
            min_temperature: Minimum temperature before stopping
            iterations_per_temp: Number of iterations at each temperature
            random_seed: Random seed for reproducibility (None = no seed)
            early_stopping_iterations: Stop if no improvement after N iterations (None = no early stopping)
        """
        self.width = width
        self.height = height
        self.max_budget = max_budget
        self.max_antennas = max_antennas
        self.initial_temperature = initial_temperature
        self.cooling_rate = cooling_rate
        self.min_temperature = min_temperature
        self.iterations_per_temp = iterations_per_temp
        self.early_stopping_iterations = early_stopping_iterations

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
            f"🌡️ Initialized SimulatedAnnealingAlgorithm: {width}x{height} grid, "
            f"T_init={initial_temperature}, cooling={cooling_rate}, "
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
                            covered_houses.add((nx, ny))
                        else:
                            covered_cells.add((nx, ny))

        return covered_cells, covered_houses

    def calculate_solution_metrics(self, antennas: List[Dict]) -> Tuple[float, int, int, int]:
        """
        Calculate metrics for a solution.

        Args:
            antennas: List of antenna placements

        Returns:
            Tuple of (energy/fitness, total_cost, users_covered, cells_covered)
        """
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

        # Energy function: maximize coverage, minimize cost
        # Lower energy is better (minimization problem)
        # Heavily penalize incomplete coverage
        if self.total_users > 0:
            coverage_score = users_covered / self.total_users
            uncovered_users = self.total_users - users_covered
        else:
            coverage_score = 0
            uncovered_users = 0

        # Energy function components (properly scaled for comparability):
        # - Uncovered users penalty: Ensures 100% coverage is prioritized
        # - Cost penalty: Optimizes for lower cost while maintaining coverage
        uncovered_penalty = uncovered_users * UNCOVERED_USER_PENALTY
        cost_penalty = total_cost / COST_DIVISOR if total_cost > 0 else 0

        energy = uncovered_penalty + cost_penalty

        # Add penalty for budget constraint violation
        if self.max_budget is not None and total_cost > self.max_budget:
            energy += 100.0 * (total_cost - self.max_budget) / self.max_budget

        # Total coverage includes both regular cells and houses
        total_coverage = len(covered_cells) + len(covered_houses)

        return energy, total_cost, users_covered, total_coverage

    def is_valid_position(self, x: int, y: int) -> bool:
        """
        Check if a position is valid for antenna placement.

        Args:
            x: X coordinate
            y: Y coordinate

        Returns:
            True if valid, False otherwise
        """
        return (0 <= x < self.width and
                0 <= y < self.height and
                (x, y) not in self.houses)

    def antenna_covers_houses(self, x: int, y: int, radius: int) -> bool:
        """
        Check if an antenna at (x, y) with given radius covers at least one house.

        Args:
            x: X coordinate
            y: Y coordinate
            radius: Coverage radius

        Returns:
            True if antenna covers at least one house, False otherwise
        """
        for house in self.houses:
            hx, hy = house
            dist_sq = (x - hx) * (x - hx) + (y - hy) * (y - hy)
            if dist_sq <= radius * radius:
                return True
        return False

    def generate_initial_solution(self) -> List[Dict]:
        """
        Generate an initial solution by placing antennas near houses.

        Strategy: Place antennas near random houses with a bias toward
        larger antenna types to provide initial coverage.

        Returns:
            List of antenna placements
        """
        antennas = []
        # Start with fewer antennas but better positioned
        max_initial = min(
            MAX_INITIAL_ANTENNAS, self.max_antennas if self.max_antennas else MAX_INITIAL_ANTENNAS)

        # Convert houses to list for random sampling
        house_list = list(self.houses)

        if not house_list:
            logger.warning("⚠️ No houses to cover, generating empty solution")
            return antennas

        # Prefer larger antenna types initially for broader coverage
        antenna_types = list(self.antenna_specs.keys())
        # Sort by radius (descending) to prefer larger antennas
        antenna_types.sort(
            key=lambda t: self.antenna_specs[t].radius, reverse=True)

        # Track placed positions to avoid duplicates
        placed_positions = set()

        # Try to place antennas near houses
        attempts = 0
        max_attempts = max_initial * 10

        while len(antennas) < max_initial and attempts < max_attempts:
            attempts += 1

            # Pick a random house to cover
            target_house = random.choice(house_list)

            # Bias toward larger antennas for initial solution
            if random.random() < INITIAL_LARGE_ANTENNA_BIAS and len(antenna_types) > 0:
                antenna_type = antenna_types[0]  # Largest antenna
            else:
                antenna_type = random.choice(antenna_types)

            spec = self.antenna_specs[antenna_type]

            # Try to place antenna near the target house
            # Search in expanding radius around the house
            for search_radius in range(0, min(spec.radius + 5, max(self.width, self.height))):
                candidates = []

                # Generate candidate positions in a ring around the house
                for dx in range(-search_radius, search_radius + 1):
                    for dy in range(-search_radius, search_radius + 1):
                        # Check if on the current search radius ring (approximate)
                        dist_sq = dx * dx + dy * dy
                        if search_radius * search_radius <= dist_sq <= (search_radius + 1) * (search_radius + 1):
                            x, y = target_house[0] + dx, target_house[1] + dy

                            if (self.is_valid_position(x, y) and
                                    (x, y) not in placed_positions):
                                candidates.append((x, y))

                # If we found valid candidates, pick one randomly
                if candidates:
                    x, y = random.choice(candidates)

                    antenna = {
                        "x": x,
                        "y": y,
                        "type": antenna_type,
                        "radius": spec.radius,
                        "cost": spec.cost
                    }

                    antennas.append(antenna)
                    placed_positions.add((x, y))
                    break  # Found a position, move to next antenna

        logger.debug(
            f"🎲 Generated initial solution with {len(antennas)} antennas near houses")
        return antennas

    def generate_neighbor(self, current_solution: List[Dict]) -> List[Dict]:
        """
        Generate a neighboring solution by making a random change.

        Operations:
        1. Add a new antenna
        2. Remove an antenna
        3. Move an antenna
        4. Change antenna type

        Args:
            current_solution: Current list of antennas

        Returns:
            New solution (neighbor)
        """
        new_solution = [ant.copy() for ant in current_solution]

        if not new_solution:
            # If empty, add an antenna
            return self.generate_initial_solution()[:1]

        # Select random operation based on configured weights
        operation = random.choices(
            ["add", "remove", "move", "change_type"],
            weights=[OPERATION_WEIGHT_ADD, OPERATION_WEIGHT_REMOVE,
                     OPERATION_WEIGHT_MOVE, OPERATION_WEIGHT_CHANGE_TYPE],
            k=1
        )[0]

        # Get current antenna positions to avoid duplicates
        occupied_positions = {(ant['x'], ant['y']) for ant in new_solution}

        # Calculate current cost for budget checking
        current_cost = sum(ant['cost'] for ant in new_solution)

        # Check constraints before operations
        can_add = (self.max_antennas is None or len(
            new_solution) < self.max_antennas)

        if operation == "add" and can_add:
            # Add a new antenna at random position
            for _ in range(50):  # Try up to 50 times to find valid position
                x = random.randint(0, self.width - 1)
                y = random.randint(0, self.height - 1)

                # Check valid position AND not already occupied by another antenna
                if self.is_valid_position(x, y) and (x, y) not in occupied_positions:
                    antenna_type = random.choice(
                        list(self.antenna_specs.keys()))
                    spec = self.antenna_specs[antenna_type]

                    # Pre-check budget if constraint exists
                    if self.max_budget is not None and current_cost + spec.cost > self.max_budget:
                        continue  # Skip this antenna, try another position/type

                    # Ensure antenna covers at least one house
                    if not self.antenna_covers_houses(x, y, spec.radius):
                        continue  # Skip this antenna, try another position

                    new_antenna = {
                        "x": x,
                        "y": y,
                        "type": antenna_type,
                        "radius": spec.radius,
                        "cost": spec.cost
                    }
                    new_solution.append(new_antenna)
                    break

        elif operation == "remove" and len(new_solution) > 1:
            # Remove a random antenna
            idx = random.randint(0, len(new_solution) - 1)
            new_solution.pop(idx)

        elif operation == "move" and new_solution:
            # Move a random antenna to a new position
            idx = random.randint(0, len(new_solution) - 1)
            original_antenna = new_solution[idx].copy()

            for _ in range(50):
                x = random.randint(0, self.width - 1)
                y = random.randint(0, self.height - 1)

                if self.is_valid_position(x, y) and self.antenna_covers_houses(x, y, new_solution[idx]["radius"]):
                    new_solution[idx]["x"] = x
                    new_solution[idx]["y"] = y
                    break
            else:
                # If we couldn't find a valid position, revert to original
                new_solution[idx] = original_antenna

        elif operation == "change_type" and new_solution:
            # Change the type of a random antenna
            idx = random.randint(0, len(new_solution) - 1)
            antenna_type = random.choice(list(self.antenna_specs.keys()))
            spec = self.antenna_specs[antenna_type]

            new_solution[idx]["type"] = antenna_type
            new_solution[idx]["radius"] = spec.radius
            new_solution[idx]["cost"] = spec.cost

        return new_solution

    def acceptance_probability(self, current_energy: float, new_energy: float, temperature: float) -> float:
        """
        Calculate the probability of accepting a worse solution.

        Args:
            current_energy: Energy of current solution
            new_energy: Energy of new solution
            temperature: Current temperature

        Returns:
            Acceptance probability
        """
        if new_energy < current_energy:
            return 1.0  # Always accept better solutions

        if temperature <= 0:
            return 0.0

        # Metropolis criterion
        return math.exp(-(new_energy - current_energy) / temperature)

    def remove_useless_antennas(self, antennas: List[Dict]) -> List[Dict]:
        """
        Remove antennas that don't cover any houses.

        Args:
            antennas: List of antenna placements

        Returns:
            Filtered list with only useful antennas
        """
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
        """
        Run the simulated annealing optimization.

        Returns:
            Dictionary containing optimization results
        """
        logger.info("🔥 Starting simulated annealing optimization...")

        # Generate initial solution
        current_solution = self.generate_initial_solution()
        current_energy, current_cost, current_users, current_cells = self.calculate_solution_metrics(
            current_solution)

        # Track best solution
        best_solution = [ant.copy() for ant in current_solution]
        best_energy = current_energy
        best_metrics = (current_cost, current_users, current_cells)

        logger.info(
            f"📊 Initial solution: {len(current_solution)} antennas, "
            f"energy={current_energy:.4f}, users={current_users}, cost=${current_cost}"
        )

        temperature = self.initial_temperature
        iteration = 0
        accepted_moves = 0
        total_moves = 0
        iterations_since_improvement = 0
        last_best_energy = best_energy

        # Simulated annealing loop
        while temperature > self.min_temperature:
            for _ in range(self.iterations_per_temp):
                iteration += 1
                total_moves += 1
                iterations_since_improvement += 1

                # Generate neighbor solution
                new_solution = self.generate_neighbor(current_solution)
                new_energy, new_cost, new_users, new_cells = self.calculate_solution_metrics(
                    new_solution)

                # Calculate acceptance probability
                accept_prob = self.acceptance_probability(
                    current_energy, new_energy, temperature)

                # Decide whether to accept the new solution
                if random.random() < accept_prob:
                    current_solution = new_solution
                    current_energy = new_energy
                    current_cost = new_cost
                    current_users = new_users
                    current_cells = new_cells
                    accepted_moves += 1

                    # Update best solution if this is better
                    if current_energy < best_energy:
                        best_solution = [ant.copy()
                                         for ant in current_solution]
                        best_energy = current_energy
                        best_metrics = (
                            current_cost, current_users, current_cells)
                        iterations_since_improvement = 0  # Reset counter

                        logger.debug(
                            f"✨ New best at iteration {iteration}: "
                            f"{len(best_solution)} antennas, energy={best_energy:.4f}, "
                            f"users={current_users}, cost=${current_cost}"
                        )

            # Early stopping check
            if (self.early_stopping_iterations is not None and
                    iterations_since_improvement >= self.early_stopping_iterations):
                logger.info(
                    f"⏹️ Early stopping: No improvement for {iterations_since_improvement} iterations"
                )
                break

            # Cool down
            temperature *= self.cooling_rate

            if iteration % 500 == 0:
                # Guard against division by zero
                acceptance_rate = (
                    accepted_moves / total_moves) if total_moves > 0 else 0.0
                logger.info(
                    f"🌡️ T={temperature:.2f}, iteration={iteration}, "
                    f"acceptance_rate={acceptance_rate:.2%}, "
                    f"best_energy={best_energy:.4f}"
                )

        # Clean up: remove any antennas that don't cover houses
        best_solution = self.remove_useless_antennas(best_solution)

        # Recalculate final metrics after cleanup
        if best_solution:
            _, best_cost, best_users, best_cells = self.calculate_solution_metrics(
                best_solution)
        else:
            best_cost, best_users, best_cells = 0, 0, 0

        total_cells = self.width * self.height
        coverage_percentage = (best_cells / total_cells *
                               100) if total_cells > 0 else 0
        user_coverage_percentage = (
            best_users / self.total_users * 100) if self.total_users > 0 else 0

        final_acceptance_rate = (
            accepted_moves / total_moves) if total_moves > 0 else 0.0

        logger.info(
            f"🏁 Simulated annealing complete: {len(best_solution)} antennas placed"
        )
        logger.info(f"💰 Total cost: ${best_cost:,}")
        logger.info(
            f"👥 Users covered: {best_users}/{self.total_users} ({user_coverage_percentage:.2f}%)")
        logger.info(
            f"📡 Area coverage: {best_cells}/{total_cells} cells ({coverage_percentage:.2f}%)")
        logger.info(
            f"🔄 Total iterations: {iteration}, Acceptance rate: {final_acceptance_rate:.2%}")

        return {
            "antennas": best_solution,
            "coverage_percentage": coverage_percentage,
            "users_covered": best_users,
            "total_users": self.total_users,
            "user_coverage_percentage": user_coverage_percentage,
            "total_cost": best_cost
        }
