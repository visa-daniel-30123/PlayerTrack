## Player Performance Tracker

A small full-stack app to track players and their game-by-game performances.

### Stack

- **Backend**: Node + Express + SQLite (`server.js`)
- **Frontend**: React + Vite + TypeScript (`frontend/`)

### Running the app

1. **Install dependencies**

   ```bash
   cd D:\RinfProj\PlayerTrack
   npm install
   cd frontend
   npm install
   ```

2. **Start the backend API**

   ```bash
   cd D:\RinfProj\PlayerTrack
   npm run dev:server
   ```

   The API will be available at `http://localhost:4000/api`.

3. **Start the React frontend (in a second terminal)**

   ```bash
   cd D:\RinfProj\PlayerTrack\frontend
   npm run dev
   ```

   Vite will print a local URL (usually `http://localhost:5173`).

### Features

- **Players**
  - Create, edit, and delete players (name, position, team)
  - Sidebar list with active selection state

- **Performances**
  - For a selected player, log game performances (date, points, assists, rebounds, notes)
  - Edit and delete existing performance entries
  - Clean table layout with modern, dark-themed UI

All data is persisted in a local SQLite database file `playertrack.db` in the project root.

