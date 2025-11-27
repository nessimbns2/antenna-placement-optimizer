from typing import List, Tuple, Set, Dict
import logging
import random
import math
from app.models import AntennaType, AntennaSpec

logger = logging.getLogger(__name__)

USERS_PER_HOUSE = 20  # Each house contains 20 users


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
        iterations_per_temp: int = 100
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
        """
        self.width = width
        self.height = height
        self.max_budget = max_budget
        self.max_antennas = max_antennas
        self.initial_temperature = initial_temperature
        self.cooling_rate = cooling_rate
        self.min_temperature = min_temperature
        self.iterations_per_temp = iterations_per_temp

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

        # Energy function prioritizes coverage over cost
        # Each uncovered user adds significant penalty
        uncovered_penalty = uncovered_users * 10.0  # Heavy penalty per uncovered user

        # Cost penalty is much smaller - only matters when coverage is equal
        cost_penalty = total_cost / 1000000.0 if total_cost > 0 else 0

        energy = uncovered_penalty + cost_penalty

        # Add penalty for budget constraint violation
        if self.max_budget is not None and total_cost > self.max_budget:
            energy += 100.0 * (total_cost - self.max_budget) / self.max_budget

        return energy, total_cost, users_covered, len(covered_cells)

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

    def generate_initial_solution(self) -> List[Dict]:
        """
        Generate an initial solution using random placement.

        Returns:
            List of antenna placements
        """
        antennas = []
        # Start with more antennas to ensure better initial coverage
        max_initial = min(20, self.max_antennas if self.max_antennas else 20)

        # Try to place some initial antennas randomly
        for _ in range(max_initial * 3):  # Try 3x to account for invalid positions
            if len(antennas) >= max_initial:
                break

            # Random position
            x = random.randint(0, self.width - 1)
            y = random.randint(0, self.height - 1)

            if not self.is_valid_position(x, y):
                continue

            # Random antenna type
            antenna_type = random.choice(list(self.antenna_specs.keys()))
            spec = self.antenna_specs[antenna_type]

            antenna = {
                "x": x,
                "y": y,
                "type": antenna_type,
                "radius": spec.radius,
                "max_users": spec.max_users,
                "cost": spec.cost
            }

            antennas.append(antenna)

        logger.debug(
            f"🎲 Generated initial solution with {len(antennas)} antennas")
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

        # Bias towards adding antennas more often to improve coverage
        operation = random.choices(
            ["add", "remove", "move", "change_type"],
            weights=[40, 20, 25, 15],  # Favor adding antennas
            k=1
        )[0]

        # Check constraints before operations
        can_add = (self.max_antennas is None or len(
            new_solution) < self.max_antennas)

        if operation == "add" and can_add:
            # Add a new antenna at random position
            for _ in range(50):  # Try up to 50 times to find valid position
                x = random.randint(0, self.width - 1)
                y = random.randint(0, self.height - 1)

                if self.is_valid_position(x, y):
                    antenna_type = random.choice(
                        list(self.antenna_specs.keys()))
                    spec = self.antenna_specs[antenna_type]

                    new_antenna = {
                        "x": x,
                        "y": y,
                        "type": antenna_type,
                        "radius": spec.radius,
                        "max_users": spec.max_users,
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

            for _ in range(50):
                x = random.randint(0, self.width - 1)
                y = random.randint(0, self.height - 1)

                if self.is_valid_position(x, y):
                    new_solution[idx]["x"] = x
                    new_solution[idx]["y"] = y
                    break

        elif operation == "change_type" and new_solution:
            # Change the type of a random antenna
            idx = random.randint(0, len(new_solution) - 1)
            antenna_type = random.choice(list(self.antenna_specs.keys()))
            spec = self.antenna_specs[antenna_type]

            new_solution[idx]["type"] = antenna_type
            new_solution[idx]["radius"] = spec.radius
            new_solution[idx]["max_users"] = spec.max_users
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

        # Simulated annealing loop
        while temperature > self.min_temperature:
            for _ in range(self.iterations_per_temp):
                iteration += 1
                total_moves += 1

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

                        logger.debug(
                            f"✨ New best at iteration {iteration}: "
                            f"{len(best_solution)} antennas, energy={best_energy:.4f}, "
                            f"users={current_users}, cost=${current_cost}"
                        )

            # Cool down
            temperature *= self.cooling_rate

            if iteration % 500 == 0:
                logger.info(
                    f"🌡️ T={temperature:.2f}, iteration={iteration}, "
                    f"acceptance_rate={accepted_moves/total_moves:.2%}, "
                    f"best_energy={best_energy:.4f}"
                )

        # Calculate final metrics
        best_cost, best_users, best_cells = best_metrics
        total_cells = self.width * self.height
        coverage_percentage = (best_cells / total_cells *
                               100) if total_cells > 0 else 0
        user_coverage_percentage = (
            best_users / self.total_users * 100) if self.total_users > 0 else 0

        logger.info(
            f"🏁 Simulated annealing complete: {len(best_solution)} antennas placed"
        )
        logger.info(f"💰 Total cost: ${best_cost:,}")
        logger.info(
            f"👥 Users covered: {best_users}/{self.total_users} ({user_coverage_percentage:.2f}%)")
        logger.info(
            f"📡 Area coverage: {best_cells}/{total_cells} cells ({coverage_percentage:.2f}%)")
        logger.info(
            f"🔄 Total iterations: {iteration}, Acceptance rate: {accepted_moves/total_moves:.2%}")

        return {
            "antennas": best_solution,
            "coverage_percentage": coverage_percentage,
            "users_covered": best_users,
            "total_users": self.total_users,
            "user_coverage_percentage": user_coverage_percentage,
            "total_cost": best_cost
        }
