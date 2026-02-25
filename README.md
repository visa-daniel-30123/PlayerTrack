 LLM FOLOSIT : CURSOR AI


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


Descriere scurtă a aplicației
Player Performance Tracker – Global Hoops Scouting este o aplicație full‑stack pentru scouting de baschet care:
Gestionează jucători și meciuri: poți adăuga jucători, loga performanțele lor pe meci (puncte, assisturi, recuperări, minute jucate, notițe), cu date salvate într‑o bază de date SQLite.
Calculează automat statistici: eficiență pe meci, medii pe jucător (puncte, assisturi, recuperări, minute), plus un „Top scorer” după media punctelor.
Oferă două zone de lucru:
pagină publică Global Hoops, cu descrierea agenției, top 3 jucători și formular de aplicație pentru viitori colegi;
secțiuni interne Players și Stats, vizibile doar după login de staff (cont admin / admin1).
Are o interfață modernă React: dark theme, layout pe două coloane, carduri curate, căutare de jucători, tabele responsive și formular de aplicație cu validare și feedback vizual.



Hurdel: When I first tried to run the React frontend, Vite crashed with a cryptic error about crypto.hash not being a function and a warning that my Node version was 19.8.1 while Vite required 20.19+ or 22.12+. The hallucination risk here is to start “fixing” crypto or changing Vite config, instead of recognizing it’s purely a runtime version mismatch.