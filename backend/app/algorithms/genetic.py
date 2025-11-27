from typing import List, Tuple, Set, Dict
import logging
import random
import time
from copy import deepcopy

from app.models import AntennaType, AntennaSpec

logger = logging.getLogger(__name__)

USERS_PER_HOUSE = 20  # Each house contains 20 users


class GeneticAlgorithm:
    """Genetic algorithm for antenna placement optimization."""

    def __init__(
        self,
        width: int,
        height: int,
        antenna_specs: Dict[AntennaType, AntennaSpec],
        houses: List[Tuple[int, int]],
        allowed_antenna_types: List[AntennaType] | None = None,
        max_budget: int | None = None,
        max_antennas: int | None = None,
        population_size: int = 50,  # from 30
        generations: int = 100,     # from 50
        mutation_rate: float = 0.15,
        crossover_rate: float = 0.7
    ):
        """
        Initialize the genetic algorithm.

        Args:
            width: Grid width
            height: Grid height
            antenna_specs: Dictionary of antenna specifications
            houses: List of house coordinates (each has 20 users)
            allowed_antenna_types: List of allowed antenna types (None = all types allowed)
            max_budget: Maximum budget constraint (None = no limit)
            max_antennas: Maximum number of antennas constraint (None = no limit)
            population_size: Number of solutions in population
            generations: Number of generations to evolve
            mutation_rate: Probability of mutation
            crossover_rate: Probability of crossover
        """
        self.width = width
        self.height = height
        self.max_budget = max_budget
        self.max_antennas = max_antennas

        # Filter antenna specs by allowed types
        if allowed_antenna_types:
            self.antenna_specs = {
                k: v for k, v in antenna_specs.items() if k in allowed_antenna_types
            }
        else:
            self.antenna_specs = antenna_specs

        self.houses = set(houses)
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate

        logger.info(
            f"Initialized GeneticAlgorithm: {width}x{height} grid, {len(houses)} houses, "
            f"population={population_size}, generations={generations}, "
            f"mutation_rate={mutation_rate}, crossover_rate={crossover_rate}"
        )

    def antenna_covers_house(self, antenna: Dict, houses: set) -> bool:
        """Check if an antenna covers at least one house."""
        for house_x, house_y in houses:
            distance = ((antenna['x'] - house_x) ** 2 +
                        (antenna['y'] - house_y) ** 2) ** 0.5
            if distance <= antenna['radius']:
                return True
        return False

    def remove_useless_antennas(self, solution: List[Dict]) -> List[Dict]:
        """Remove antennas that don't cover any house."""
        return [antenna for antenna in solution if self.antenna_covers_house(antenna, self.houses)]

    def create_random_solution(self, max_antennas: int = 15) -> List[Dict]:
        """Create a random solution (chromosome)."""
        # Use constraint if provided, otherwise use default max
        if self.max_antennas:
            max_antennas = self.max_antennas
        
        num_antennas = random.randint(1, max_antennas)
        solution = []
        attempts = 0
        max_attempts = num_antennas * 3  # Allow more attempts to find valid positions

        while len(solution) < num_antennas and attempts < max_attempts:
            attempts += 1
            # Random position
            x = random.randint(0, self.width - 1)
            y = random.randint(0, self.height - 1)

            # Skip if on a house
            if (x, y) in self.houses:
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

            # Only add if it covers at least one house
            if self.antenna_covers_house(antenna, self.houses):
                solution.append(antenna)

        # Check budget constraint
        if self.max_budget:
            total_cost = sum(ant['cost'] for ant in solution)
            while total_cost > self.max_budget and solution:
                # Remove most expensive antenna
                solution.sort(key=lambda a: a['cost'], reverse=True)
                solution.pop(0)
                total_cost = sum(ant['cost'] for ant in solution)

        return solution

    def calculate_fitness(self, solution: List[Dict]) -> float:
        """
        Calculate fitness of a solution.
        Fitness = coverage_weight * coverage_ratio - cost_weight * normalized_cost + bonus
        Higher fitness is better.
        """
        if not solution:
            return -float('inf')

        # Check budget constraint
        total_cost = sum(ant['cost'] for ant in solution)
        if self.max_budget and total_cost > self.max_budget:
            return -float('inf')

        # Check antenna count constraint
        if self.max_antennas and len(solution) > self.max_antennas:
            return -float('inf')

        # Calculate coverage
        covered_houses = set()
        for antenna in solution:
            for house_x, house_y in self.houses:
                distance = ((antenna['x'] - house_x) ** 2 +
                            (antenna['y'] - house_y) ** 2) ** 0.5
                if distance <= antenna['radius']:
                    covered_houses.add((house_x, house_y))

        coverage_ratio = len(covered_houses) / \
            len(self.houses) if self.houses else 0

        # Calculate normalized cost
        max_possible_cost = len(solution) * \
            max(spec.cost for spec in self.antenna_specs.values())
        normalized_cost = total_cost / \
            max_possible_cost if max_possible_cost > 0 else 0

        # Fitness function: balance coverage and cost
        coverage_weight = 100   # High weight for coverage
        cost_weight = 50        # HUGE weight for cost penalty

        fitness = coverage_weight * coverage_ratio - cost_weight * normalized_cost

        # Bonus for 100% coverage
        if coverage_ratio >= 1.0:
            fitness += 50

        return fitness

    def initialize_population(self) -> List[List[Dict]]:
        """Create initial population of random solutions."""
        return [self.create_random_solution() for _ in range(self.population_size)]

    def selection(self, population: List[List[Dict]], fitnesses: List[float]) -> List[List[Dict]]:
        """Tournament selection: choose best from random subset."""
        selected = []
        tournament_size = 3

        for _ in range(len(population)):
            # Random tournament
            tournament_indices = random.sample(
                range(len(population)), tournament_size)
            tournament_fitnesses = [fitnesses[i] for i in tournament_indices]
            winner_idx = tournament_indices[tournament_fitnesses.index(
                max(tournament_fitnesses))]
            selected.append(deepcopy(population[winner_idx]))

        return selected

    def crossover(self, parent1: List[Dict], parent2: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Single-point crossover: combine two parent solutions."""
        if random.random() > self.crossover_rate or not parent1 or not parent2:
            return deepcopy(parent1), deepcopy(parent2)

        # Single-point crossover
        point1 = random.randint(0, len(parent1))
        point2 = random.randint(0, len(parent2))

        child1 = parent1[:point1] + parent2[point2:]
        child2 = parent2[:point2] + parent1[point1:]

        # Remove useless antennas from children
        child1 = self.remove_useless_antennas(child1)
        child2 = self.remove_useless_antennas(child2)

        # Enforce antenna count constraint first (hard limit)
        default_max = 15
        max_allowed = self.max_antennas if self.max_antennas else default_max
        if len(child1) > max_allowed:
            child1 = child1[:max_allowed]
        if len(child2) > max_allowed:
            child2 = child2[:max_allowed]

        # Enforce budget constraint
        if self.max_budget:
            # Remove most expensive antennas until under budget
            for child in [child1, child2]:
                total_cost = sum(ant['cost'] for ant in child)
                while total_cost > self.max_budget and child:
                    child.sort(key=lambda a: a['cost'], reverse=True)
                    child.pop(0)
                    total_cost = sum(ant['cost'] for ant in child)

        return child1, child2

    def mutate(self, solution: List[Dict]) -> List[Dict]:
        """Apply random mutations to solution."""
        if random.random() > self.mutation_rate:
            return solution

        mutation_type = random.choice(['add', 'remove', 'modify'])

        if mutation_type == 'add':
            # Check constraints before adding
            if self.max_antennas and len(solution) >= self.max_antennas:
                return solution

            # Add new antenna (only if it covers at least one house)
            attempts = 0
            max_attempts = 20
            while attempts < max_attempts:
                attempts += 1
                x = random.randint(0, self.width - 1)
                y = random.randint(0, self.height - 1)
                if (x, y) not in self.houses:
                    antenna_type = random.choice(
                        list(self.antenna_specs.keys()))
                    spec = self.antenna_specs[antenna_type]
                    antenna = {
                        "x": x, "y": y, "type": antenna_type,
                        "radius": spec.radius, "max_users": spec.max_users, "cost": spec.cost
                    }

                    # Check budget constraint
                    if self.max_budget:
                        total_cost = sum(
                            ant['cost'] for ant in solution) + antenna['cost']
                        if total_cost > self.max_budget:
                            continue

                    # Only add if it covers at least one house
                    if self.antenna_covers_house(antenna, self.houses):
                        solution.append(antenna)
                        break

        elif mutation_type == 'remove' and solution:
            # Remove random antenna
            solution.pop(random.randint(0, len(solution) - 1))

        elif mutation_type == 'modify' and solution:
            # Modify random antenna type
            idx = random.randint(0, len(solution) - 1)
            old_antenna = solution[idx]

            # Try different antenna types
            for antenna_type in self.antenna_specs.keys():
                spec = self.antenna_specs[antenna_type]
                new_antenna = {
                    "x": old_antenna['x'],
                    "y": old_antenna['y'],
                    "type": antenna_type,
                    "radius": spec.radius,
                    "max_users": spec.max_users,
                    "cost": spec.cost
                }

                # Check budget constraint
                if self.max_budget:
                    total_cost = sum(
                        ant['cost'] for ant in solution) - old_antenna['cost'] + new_antenna['cost']
                    if total_cost > self.max_budget:
                        continue

                # Only modify if new type still covers at least one house
                if self.antenna_covers_house(new_antenna, self.houses):
                    solution[idx] = new_antenna
                    break

        return solution

    def optimize(self) -> Dict:
        """Run the genetic algorithm."""
        logger.info("Starting genetic algorithm optimization...")
        logger.info("Constraint: Every antenna must cover at least one house")

        start_time = time.time()

        # Initialize population
        population = self.initialize_population()
        best_solution = None
        best_fitness = -float('inf')

        for generation in range(self.generations):
            # Evaluate fitness
            fitnesses = [self.calculate_fitness(sol) for sol in population]

            # Track best solution
            gen_best_idx = fitnesses.index(max(fitnesses))
            if fitnesses[gen_best_idx] > best_fitness:
                best_fitness = fitnesses[gen_best_idx]
                best_solution = deepcopy(population[gen_best_idx])

            # Log progress
            if generation % 10 == 0 or generation == self.generations - 1:
                avg_fitness = sum(fitnesses) / len(fitnesses)
                avg_antennas = sum(len(sol)
                                   for sol in population) / len(population)
                logger.info(
                    f"Generation {generation}: Best Fitness = {best_fitness:.2f}, "
                    f"Avg = {avg_fitness:.2f}, Avg Antennas = {avg_antennas:.1f}"
                )

            # Selection
            selected = self.selection(population, fitnesses)

            # Crossover and Mutation
            next_generation = []
            for i in range(0, len(selected), 2):
                parent1 = selected[i]
                parent2 = selected[i +
                                   1] if i + 1 < len(selected) else selected[0]

                child1, child2 = self.crossover(parent1, parent2)
                child1 = self.mutate(child1)
                child2 = self.mutate(child2)

                next_generation.extend([child1, child2])

            population = next_generation[:self.population_size]

        # Calculate final statistics for best solution
        covered_houses = set()
        for antenna in best_solution:
            for house_x, house_y in self.houses:
                distance = ((antenna['x'] - house_x) ** 2 +
                            (antenna['y'] - house_y) ** 2) ** 0.5
                if distance <= antenna['radius']:
                    covered_houses.add((house_x, house_y))

        # Calculate coverage statistics
        total_cells = self.width * self.height - len(self.houses)
        covered_cells = set()
        for antenna in best_solution:
            r = antenna['radius']
            for dx in range(-r, r + 1):
                for dy in range(-r, r + 1):
                    if dx * dx + dy * dy <= r * r:
                        nx, ny = antenna['x'] + dx, antenna['y'] + dy
                        if (0 <= nx < self.width and 0 <= ny < self.height and
                                (nx, ny) not in self.houses):
                            covered_cells.add((nx, ny))

        coverage_percentage = (len(covered_cells) / total_cells *
                               100) if total_cells > 0 else 0

        total_houses = len(self.houses)
        houses_covered = len(covered_houses)
        users_covered = houses_covered * USERS_PER_HOUSE
        total_users = total_houses * USERS_PER_HOUSE
        user_coverage_percentage = (
            houses_covered / total_houses * 100) if total_houses > 0 else 0
        total_cost = sum(ant['cost'] for ant in best_solution)

        # Verify constraint
        useless_count = sum(1 for antenna in best_solution if not self.antenna_covers_house(
            antenna, self.houses))

        logger.info(
            f"Genetic Algorithm complete: "
            f"{len(best_solution)} antennas placed, "
            f"total cost: ${total_cost}, "
            f"houses covered: {houses_covered}/{total_houses} ({user_coverage_percentage:.1f}%), "
            f"users covered: {users_covered}/{total_users}, "
            f"useless antennas: {useless_count}"
        )

        return {
            "antennas": best_solution,
            "coverage_percentage": coverage_percentage,
            "users_covered": users_covered,
            "total_users": total_users,
            "user_coverage_percentage": user_coverage_percentage,
            "total_cost": total_cost
        }
