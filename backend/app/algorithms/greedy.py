from typing import List, Tuple, Set, Dict
import logging
from app.models import AntennaType, AntennaSpec

logger = logging.getLogger(__name__)

USERS_PER_HOUSE = 10  # Each house contains 10 users


class GreedyAlgorithm:
    """Greedy algorithm for cost-optimized antenna placement with user coverage target."""
    
    def __init__(
        self,
        width: int,
        height: int,
        target_coverage: float,
        antenna_specs: Dict[AntennaType, AntennaSpec],
        houses: List[Tuple[int, int]]
    ):
        """
        Initialize the greedy algorithm.
        
        Args:
            width: Grid width
            height: Grid height
            target_coverage: Target user coverage percentage (0-100)
            antenna_specs: Dictionary of antenna specifications
            houses: List of house coordinates (each has 10 users)
        """
        self.width = width
        self.height = height
        self.target_coverage = target_coverage
        self.antenna_specs = antenna_specs
        self.houses = set(houses)  # Houses where antennas cannot be placed
        self.covered_cells: Set[Tuple[int, int]] = set()
        self.covered_houses: Set[Tuple[int, int]] = set()
        self.placed_antennas: List[Dict] = []
        
        logger.info(
            f"Initialized GreedyAlgorithm: {width}x{height} grid, "
            f"target_coverage={target_coverage}%, {len(houses)} houses"
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
    
    def find_best_antenna_placement(self) -> Tuple[Tuple[int, int], AntennaType, float] | None:
        """
        Find the best antenna placement considering cost efficiency.
        
        Returns:
            Tuple of (position, antenna_type, cost_per_user) or None if no valid placement
        """
        best_position = None
        best_antenna_type = None
        best_cost_efficiency = float('inf')  # Lower is better (cost per new user)
        
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
                    
                    new_cells, new_users = self.count_new_coverage(x, y, spec.radius)
                    
                    # Only consider positions that cover new users
                    if new_users > 0:
                        # Cost efficiency: cost per new user covered
                        cost_efficiency = spec.cost / new_users
                        
                        # Prefer lower cost per user (better efficiency)
                        if cost_efficiency < best_cost_efficiency:
                            best_cost_efficiency = cost_efficiency
                            best_position = (x, y)
                            best_antenna_type = antenna_type
        
        if best_position is None:
            return None
        
        return best_position, best_antenna_type, best_cost_efficiency
    
    def optimize(self) -> Dict:
        """
        Run the greedy algorithm to minimize cost while achieving target coverage.
        
        Strategy: Iteratively place the most cost-efficient antenna (cost per new user covered)
        until target coverage is reached.
        
        Returns:
            Dictionary with optimization results including antenna positions, coverage, and costs
        """
        logger.info("Starting cost-optimized greedy algorithm")
        
        total_users = len(self.houses) * USERS_PER_HOUSE
        target_users = (self.target_coverage / 100) * total_users
        
        iteration = 0
        max_iterations = self.width * self.height  # Prevent infinite loop
        
        while len(self.covered_houses) * USERS_PER_HOUSE < target_users and iteration < max_iterations:
            iteration += 1
            
            # Find best antenna placement
            result = self.find_best_antenna_placement()
            
            if result is None:
                logger.warning(
                    f"Could not find valid position for new antenna. "
                    f"Placed {len(self.placed_antennas)} antennas. "
                    f"Achieved {len(self.covered_houses) * USERS_PER_HOUSE}/{total_users} users."
                )
                break
            
            position, antenna_type, cost_efficiency = result
            spec = self.antenna_specs[antenna_type]
            
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
            cells, houses = self.get_coverage_area(position[0], position[1], spec.radius)
            self.covered_cells.update(cells)
            new_houses = houses - self.covered_houses
            self.covered_houses.update(houses)
            
            users_covered = len(self.covered_houses) * USERS_PER_HOUSE
            current_coverage = (users_covered / total_users * 100) if total_users > 0 else 0
            
            logger.debug(
                f"Placed {antenna_type.value} antenna #{len(self.placed_antennas)} at {position}, "
                f"cost: ${spec.cost}, new users: {len(new_houses) * USERS_PER_HOUSE}, "
                f"total coverage: {current_coverage:.1f}%"
            )
            
            # Check if we've reached target
            if current_coverage >= self.target_coverage:
                break
        
        # Calculate final statistics
        total_cells = self.width * self.height - len(self.houses)
        coverage_percentage = (len(self.covered_cells) / total_cells * 100) if total_cells > 0 else 0
        
        users_covered = len(self.covered_houses) * USERS_PER_HOUSE
        user_coverage_percentage = (users_covered / total_users * 100) if total_users > 0 else 0
        
        total_capacity = sum(ant["max_users"] for ant in self.placed_antennas)
        capacity_utilization = (users_covered / total_capacity * 100) if total_capacity > 0 else 0
        
        total_cost = sum(ant["cost"] for ant in self.placed_antennas)
        
        logger.info(
            f"Cost-optimized greedy complete: {len(self.placed_antennas)} antennas placed, "
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
            "total_cost": total_cost
        }
