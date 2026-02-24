const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'playertrack.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT,
      team TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS performances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      rebounds INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )
  `);

  // Seed a few Romanian players if the table is empty
  db.get('SELECT COUNT(*) AS count FROM players', (err, row) => {
    if (err) {
      console.error('Failed to check players count for seeding', err);
      return;
    }
    if (row && row.count === 0) {
      const seedPlayers = [
        { name: 'Andrei Popescu', position: 'Guard', team: 'București Wolves' },
        { name: 'Mihai Ionescu', position: 'Forward', team: 'Cluj Titans' },
        { name: 'Alexandra Dobre', position: 'Center', team: 'Timișoara Phoenix' },
        { name: 'Raluca Stan', position: 'Wing', team: 'Brașov Bears' },
      ];
      const stmt = db.prepare('INSERT INTO players (name, position, team) VALUES (?, ?, ?)');
      seedPlayers.forEach((p) => {
        stmt.run([p.name, p.position, p.team]);
      });
      stmt.finalize();
      console.log('Seeded default Romanian players into the database.');
    }
  });
});

app.get('/api/players', (req, res) => {
  db.all('SELECT * FROM players ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch players' });
    res.json(rows);
  });
});

app.post('/api/players', (req, res) => {
  const { name, position, team } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const stmt = db.prepare('INSERT INTO players (name, position, team) VALUES (?, ?, ?)');
  stmt.run([name, position || '', team || ''], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to create player' });
    res.status(201).json({ id: this.lastID, name, position: position || '', team: team || '' });
  });
});

app.put('/api/players/:id', (req, res) => {
  const { id } = req.params;
  const { name, position, team } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const stmt = db.prepare('UPDATE players SET name = ?, position = ?, team = ? WHERE id = ?');
  stmt.run([name, position || '', team || '', id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update player' });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });
    res.json({ id: Number(id), name, position: position || '', team: team || '' });
  });
});

app.delete('/api/players/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM players WHERE id = ?');
  stmt.run([id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete player' });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });
    res.status(204).send();
  });
});

app.get('/api/players/:id/performances', (req, res) => {
  const { id } = req.params;
  db.all(
    'SELECT * FROM performances WHERE player_id = ? ORDER BY date DESC',
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch performances' });
      const withEfficiency = rows.map((row) => ({
        ...row,
        efficiency: (row.points || 0) + (row.rebounds || 0) + (row.assists || 0),
      }));
      res.json(withEfficiency);
    }
  );
});

app.post('/api/players/:id/performances', (req, res) => {
  const { id } = req.params;
  const { date, points, assists, rebounds, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });
  const stmt = db.prepare(
    'INSERT INTO performances (player_id, date, points, assists, rebounds, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(
    [id, date, points || 0, assists || 0, rebounds || 0, notes || ''],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create performance' });
      const safePoints = points || 0;
      const safeAssists = assists || 0;
      const safeRebounds = rebounds || 0;
      res.status(201).json({
        id: this.lastID,
        player_id: Number(id),
        date,
        points: safePoints,
        assists: safeAssists,
        rebounds: safeRebounds,
        notes: notes || '',
        efficiency: safePoints + safeRebounds + safeAssists,
      });
    }
  );
});

app.put('/api/performances/:id', (req, res) => {
  const { id } = req.params;
  const { date, points, assists, rebounds, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });
  const stmt = db.prepare(
    'UPDATE performances SET date = ?, points = ?, assists = ?, rebounds = ?, notes = ? WHERE id = ?'
  );
  stmt.run(
    [date, points || 0, assists || 0, rebounds || 0, notes || '', id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update performance' });
      if (this.changes === 0) return res.status(404).json({ error: 'Performance not found' });
      const safePoints = points || 0;
      const safeAssists = assists || 0;
      const safeRebounds = rebounds || 0;
      res.json({
        id: Number(id),
        date,
        points: safePoints,
        assists: safeAssists,
        rebounds: safeRebounds,
        notes: notes || '',
        efficiency: safePoints + safeRebounds + safeAssists,
      });
    }
  );
});

app.delete('/api/performances/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM performances WHERE id = ?');
  stmt.run([id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete performance' });
    if (this.changes === 0) return res.status(404).json({ error: 'Performance not found' });
    res.status(204).send();
  });
});

// Player with highest average points per game
app.get('/api/leader', (req, res) => {
  const query = `
    SELECT
      p.id,
      p.name,
      p.position,
      p.team,
      AVG(per.points) AS avgPoints,
      COUNT(per.id) AS games
    FROM players p
    JOIN performances per ON per.player_id = p.id
    GROUP BY p.id, p.name, p.position, p.team
    HAVING games > 0
    ORDER BY avgPoints DESC
    LIMIT 1
  `;

  db.get(query, [], (err, row) => {
    if (err) return res.status(500).json({ error: 'Failed to compute leader' });
    if (!row) return res.json(null);

    res.json({
      player: {
        id: row.id,
        name: row.name,
        position: row.position,
        team: row.team,
      },
      avgPoints: row.avgPoints,
      games: row.games,
    });
  });
});

// Per-player averages for points, assists, rebounds
app.get('/api/player-averages', (req, res) => {
  const query = `
    SELECT
      p.id,
      p.name,
      p.position,
      p.team,
      AVG(per.points) AS avgPoints,
      AVG(per.assists) AS avgAssists,
      AVG(per.rebounds) AS avgRebounds,
      COUNT(per.id) AS games
    FROM players p
    LEFT JOIN performances per ON per.player_id = p.id
    GROUP BY p.id, p.name, p.position, p.team
    ORDER BY avgPoints DESC NULLS LAST, p.name ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to compute player averages' });

    const result = rows.map((row) => ({
      player: {
        id: row.id,
        name: row.name,
        position: row.position,
        team: row.team,
      },
      games: row.games,
      avgPoints: row.games ? row.avgPoints : 0,
      avgAssists: row.games ? row.avgAssists : 0,
      avgRebounds: row.games ? row.avgRebounds : 0,
    }));

    res.json(result);
  });
});

app.listen(PORT, () => {
  console.log(`PlayerTrack API running on http://localhost:${PORT}`);
});

