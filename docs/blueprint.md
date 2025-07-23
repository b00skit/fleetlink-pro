# **App Name**: FleetLink Pro

## Core Features:

- Dual Table Display: Displays two tables: a main data table and a favorites table, enhancing data organization.
- Daily Sync: A sync button to update the fleet data from the source Google Sheet, limited to once per day, with timestamp stored locally.
- Local Favorites: Allows users to favorite vehicles and assignments, saved locally using browser local storage.
- Assignment Pills: Displays favorited assignments as pills above the main data table for quick filtering.
- Vehicle Default Filter: If no assignment pills are selected, favorited vehicles are displayed, providing an alternative filtered view.
- Enhanced Tables: Utilizes a modern table library like React Table (TanStack Table) with Material UI styling for smooth, interactive tables.
- AI-Powered Recommendations: Generative AI powered suggestions tool: the app will monitor what assignments and vehicles users favorite and recommend other entries from the main database that might be useful to them, given the previous favorited data.

## Style Guidelines:

- Primary color: Deep navy blue (#1A237E) to evoke professionalism and trust. Dark color scheme.
- Background color: Very dark blue (#1E293B), almost black.
- Accent color: Teal (#26A69A) for interactive elements, providing a modern and accessible contrast.
- Font pairing: 'Inter' for body text (sans-serif, modern) and 'Space Grotesk' for headlines (sans-serif, techy).
- Use Material Design icons for a consistent, clean, and recognizable visual language throughout the app.
- Employs a responsive grid layout, ensuring optimal viewing experience across devices. The favorite and main tables are clearly distinguished, and filters are readily accessible.
- Framer Motion is used for subtle transitions and animations to enhance user interaction, like fading in data rows or sliding in filter options.