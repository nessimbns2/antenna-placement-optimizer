from typing import List, Tuple, Set, Dict
import logging

logger = logging.getLogger(__name__)

USERS_PER_HOUSE = 10  # Each house contains 10 users


class GreedyAlgorithm:
    """Greedy algorithm for antenna placement optimization with user coverage."""
    
    def __init__(
        self,
        width: int,
        height: int,
        num_antennas: int,
        radius: int,
        max_users: int,
        houses: List[Tuple[int, int]]
    ):
        """
        Initialize the greedy algorithm.
        
        Args:
            width: Grid width
            height: Grid height
            num_antennas: Number of antennas to place
            radius: Coverage radius of each antenna
            max_users: Maximum users each antenna can serve
            houses: List of house coordinates (each has 10 users)
        """
        self.width = width
        self.height = height
        self.num_antennas = num_antennas
        self.radius = radius
        self.max_users = max_users
        self.houses = set(houses)  # Houses where antennas cannot be placed
        self.covered_cells: Set[Tuple[int, int]] = set()
        self.covered_houses: Set[Tuple[int, int]] = set()
        
        logger.info(
            f"Initialized GreedyAlgorithm: {width}x{height} grid, "
            f"{num_antennas} antennas, radius {radius}, max_users {max_users}, {len(houses)} houses"
        )
    
    def get_coverage_area(self, x: int, y: int) -> Tuple[Set[Tuple[int, int]], Set[Tuple[int, int]]]:
        """
        Calculate the coverage area for an antenna at position (x, y).
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            Tuple of (covered cells, covered houses)
        """
        covered_cells = set()
        covered_houses = set()
        
        for dx in range(-self.radius, self.radius + 1):
            for dy in range(-self.radius, self.radius + 1):
                # Check if within circle (Euclidean distance)
                if dx * dx + dy * dy <= self.radius * self.radius:
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
    
    def count_new_coverage(self, x: int, y: int) -> Tuple[int, int]:
        """
        Count how many new cells and users would be covered by placing an antenna at (x, y).
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            Tuple of (new cells covered, new users covered)
        """
        cells, houses = self.get_coverage_area(x, y)
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
    
    def optimize(self) -> Dict:
        """
        Run the greedy algorithm to find antenna placements.
        
        Returns:
            Dictionary with optimization results including antenna positions, coverage, and user counts
        """
        antennas = []
        
        logger.info("Starting greedy optimization")
        
        for i in range(self.num_antennas):
            best_position = None
            best_score = 0
            best_users = 0
            
            # Try all positions and find the one with maximum new coverage
            # Prioritize covering new users (houses) over empty cells
            for x in range(self.width):
                for y in range(self.height):
                    if not self.is_valid_position(x, y):
                        continue
                    
                    # Skip if antenna already placed here
                    if (x, y) in antennas:
                        continue
                    
                    new_cells, new_users = self.count_new_coverage(x, y)
                    
                    # Score: prioritize users (each user worth 10 points) over empty cells
                    score = new_users * 10 + new_cells
                    
                    if score > best_score:
                        best_score = score
                        best_users = new_users
                        best_position = (x, y)
            
            if best_position is None:
                logger.warning(
                    f"Could not find valid position for antenna {i + 1}. "
                    f"Placed {len(antennas)} antennas."
                )
                break
            
            # Place antenna at best position
            antennas.append(best_position)
            cells, houses = self.get_coverage_area(best_position[0], best_position[1])
            self.covered_cells.update(cells)
            self.covered_houses.update(houses)
            
            logger.debug(
                f"Placed antenna {i + 1}/{self.num_antennas} at {best_position}, "
                f"new users: {best_users}, "
                f"total covered cells: {len(self.covered_cells)}, "
                f"total covered houses: {len(self.covered_houses)}"
            )
        
        # Calculate coverage percentages
        total_cells = self.width * self.height - len(self.houses)
        coverage_percentage = (len(self.covered_cells) / total_cells * 100) if total_cells > 0 else 0
        
        total_users = len(self.houses) * USERS_PER_HOUSE
        users_covered = len(self.covered_houses) * USERS_PER_HOUSE
        user_coverage_percentage = (users_covered / total_users * 100) if total_users > 0 else 0
        
        total_capacity = len(antennas) * self.max_users
        capacity_utilization = (users_covered / total_capacity * 100) if total_capacity > 0 else 0
        
        logger.info(
            f"Greedy optimization complete: {len(antennas)} antennas placed, "
            f"{coverage_percentage:.2f}% area coverage, "
            f"{users_covered}/{total_users} users covered ({user_coverage_percentage:.2f}%)"
        )
        
        return {
            "antennas": antennas,
            "coverage_percentage": coverage_percentage,
            "users_covered": users_covered,
            "total_users": total_users,
            "user_coverage_percentage": user_coverage_percentage,
            "total_capacity": total_capacity,
            "capacity_utilization": capacity_utilization
        }
