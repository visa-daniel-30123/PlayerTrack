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
      res.json(rows);
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
      res.status(201).json({
        id: this.lastID,
        player_id: Number(id),
        date,
        points: points || 0,
        assists: assists || 0,
        rebounds: rebounds || 0,
        notes: notes || '',
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
      res.json({ id: Number(id), date, points: points || 0, assists: assists || 0, rebounds: rebounds || 0, notes: notes || '' });
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

app.listen(PORT, () => {
  console.log(`PlayerTrack API running on http://localhost:${PORT}`);
});

