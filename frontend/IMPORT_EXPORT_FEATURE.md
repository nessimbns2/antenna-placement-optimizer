# Import/Export Feature

## Overview

The Import/Export feature allows users to save and load complete optimization solutions as JSON files. This enables:
- Sharing solutions with team members
- Backing up work progress
- Comparing different optimization approaches
- Resuming work across sessions

## Usage

### Export a Solution

1. Configure your grid with houses and/or run an optimization
2. Click the **Export** button in the Grid Seeding panel (Actions section)
3. A JSON file will be downloaded with the filename format: `antenna-solution-YYYY-MM-DD-HH-MM-SS.json`

### Import a Solution

1. Click the **Import** button in the Grid Seeding panel (Actions section)
2. Select a previously exported JSON file
3. The application will load:
   - Grid dimensions
   - House placements
   - Manual antenna placements
   - Optimization results (if available)
   - Algorithm settings
   - Allowed antenna types

## File Format

The exported JSON file contains:

```json
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T12:30:45.000Z",
  "gridSize": {
    "rows": 20,
    "cols": 20
  },
  "houses": [[5, 10], [8, 12], ...],
  "manualAntennas": [
    {"x": 10, "y": 10, "type": "Pico"},
    ...
  ],
  "optimizationResult": {
    "antennas": [...],
    "coverage_percentage": 95.5,
    "total_cost": 25000,
    ...
  },
  "algorithm": "greedy",
  "allowedAntennaTypes": ["Femto", "Pico", "Micro", "Macro"]
}
```

## Implementation Details

### Files Added
- `frontend/lib/solution-export.ts` - Core import/export utility functions

### Files Modified
- `frontend/components/grid-seeding-panel.tsx` - Added Export/Import buttons
- `frontend/app/page.tsx` - Integrated import/export handlers with state management

### Key Functions

- `exportSolution()` - Serializes current state and downloads as JSON
- `importSolution()` - Parses JSON file and validates structure
- `applySolutionData()` - Applies imported data to application state

## Error Handling

- Invalid file format shows error alert
- Missing required fields are validated
- Out-of-bounds coordinates are skipped
- File read errors are caught and logged
