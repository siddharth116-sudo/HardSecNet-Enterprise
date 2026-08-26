# HardSecNet Dashboard Architecture

This dashboard has been refactored into a scalable, component-based React architecture.

## Folder Structure

### `src/components/`
Contains all reusable UI components, organized by domain.
- **layout/**: Structural components like `Navbar` and `Terminal`.
- **dashboard/**: Widgets specific to the main dashboard view (`ScoreCard`, `AuditTable`, `AIInsights`).
- **network/**: Network monitoring table.
- **research/**: Research data visualizations.
- **modals/**: Pop-up dialogs like `AddNodeModal`.

### `src/pages/`
High-level page views.
- `LoginScreen.jsx`: The standalone authentication page.
- *(Future pages like Settings or UserManagement would go here)*.

### `src/services/`
Handles communication with the backend.
- `api.js`: Centralizes `fetch` calls, authentication headers, and error handling.

### `src/utils/`
Helper functions.
- `helpers.js`: Pure functions for calculations (e.g., Compliance Score) and formatting.

### `src/constants/`
Global configuration.
- `config.js`: API URLs, polling intervals, and other constants.

### `src/hooks/`
(Reserved for custom hooks like `useAuth` or `useSocket` in future iterations).

## Key Principles
1.  **Single Responsibility**: `App.jsx` handles state/logic, components handle rendering.
2.  **Centralized Config**: API URLs are no longer hardcoded in components.
3.  **Modular CSS**: Tailwind classes are used throughout for consistent styling.
