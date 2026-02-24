import { useEffect, useState } from 'react';
import './App.css';

type Player = {
  id: number;
  name: string;
  position: string;
  team: string;
};

type Performance = {
  id: number;
  player_id: number;
  date: string;
  points: number;
  assists: number;
  rebounds: number;
  notes: string;
};

const API_BASE = 'http://localhost:4000/api';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingPerformances, setLoadingPerformances] = useState(false);
  const [playerForm, setPlayerForm] = useState<Partial<Player>>({});
  const [performanceForm, setPerformanceForm] = useState<Partial<Performance>>({
    date: new Date().toISOString().slice(0, 10),
  });
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingPerformanceId, setEditingPerformanceId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = async () => {
    setLoadingPlayers(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/players`);
      const data = await res.json();
      setPlayers(data);
      if (!selectedPlayer && data.length > 0) {
        setSelectedPlayer(data[0]);
      }
    } catch {
      setError('Failed to load players');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const fetchPerformances = async (playerId: number) => {
    setLoadingPerformances(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/players/${playerId}/performances`);
      const data = await res.json();
      setPerformances(data);
    } catch {
      setError('Failed to load performances');
    } finally {
      setLoadingPerformances(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      fetchPerformances(selectedPlayer.id);
      setPerformanceForm((prev) => ({
        ...prev,
        player_id: selectedPlayer.id,
        date: new Date().toISOString().slice(0, 10),
      }));
    } else {
      setPerformances([]);
    }
  }, [selectedPlayer]);

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.name) {
      setError('Player name is required');
      return;
    }
    setError(null);
    try {
      const isEditing = editingPlayerId !== null;
      const url = isEditing
        ? `${API_BASE}/players/${editingPlayerId}`
        : `${API_BASE}/players`;
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerForm.name,
          position: playerForm.position || '',
          team: playerForm.team || '',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save player');
      }
      await fetchPlayers();
      setPlayerForm({});
      setEditingPlayerId(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const startEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setPlayerForm(player);
  };

  const deletePlayer = async (playerId: number) => {
    if (!confirm('Delete this player and all their performances?')) return;
    try {
      const res = await fetch(`${API_BASE}/players/${playerId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        throw new Error('Failed to delete player');
      }
      if (selectedPlayer?.id === playerId) {
        setSelectedPlayer(null);
        setPerformances([]);
      }
      await fetchPlayers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handlePerformanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) {
      setError('Select a player first');
      return;
    }
    if (!performanceForm.date) {
      setError('Date is required');
      return;
    }
    setError(null);
    try {
      const isEditing = editingPerformanceId !== null;
      const url = isEditing
        ? `${API_BASE}/performances/${editingPerformanceId}`
        : `${API_BASE}/players/${selectedPlayer.id}/performances`;
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: performanceForm.date,
          points: Number(performanceForm.points || 0),
          assists: Number(performanceForm.assists || 0),
          rebounds: Number(performanceForm.rebounds || 0),
          notes: performanceForm.notes || '',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save performance');
      }
      await fetchPerformances(selectedPlayer.id);
      setPerformanceForm({
        date: new Date().toISOString().slice(0, 10),
        player_id: selectedPlayer.id,
      });
      setEditingPerformanceId(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const startEditPerformance = (p: Performance) => {
    setEditingPerformanceId(p.id);
    setPerformanceForm(p);
  };

  const deletePerformance = async (id: number) => {
    if (!confirm('Delete this performance entry?')) return;
    try {
      const res = await fetch(`${API_BASE}/performances/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        throw new Error('Failed to delete performance');
      }
      if (selectedPlayer) {
        await fetchPerformances(selectedPlayer.id);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Player Performance Tracker</h1>
          <p className="subtitle">
            Track game-by-game impact with a clean, focused dashboard.
          </p>
        </div>
      </header>

      <main className="layout">
        <section className="card">
          <div className="card-header">
            <h2>Players</h2>
            {loadingPlayers && <span className="pill">Loading...</span>}
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="players-section">
            <div className="players-list">
              {players.length === 0 && !loadingPlayers && (
                <p className="muted">No players yet. Add your first player below.</p>
              )}
              <ul>
                {players.map((player) => (
                  <li
                    key={player.id}
                    className={
                      'player-row ' +
                      (selectedPlayer?.id === player.id ? 'player-row--active' : '')
                    }
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <div>
                      <div className="player-name">{player.name}</div>
                      <div className="player-meta">
                        {player.position && <span>{player.position}</span>}
                        {player.team && (
                          <span>{player.position ? ' • ' : ''}{player.team}</span>
                        )}
                      </div>
                    </div>
                    <div className="player-actions">
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditPlayer(player);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ghost-btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlayer(player.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <form className="form" onSubmit={handlePlayerSubmit}>
              <h3>{editingPlayerId ? 'Edit player' : 'Add player'}</h3>
              <div className="form-grid">
                <label>
                  <span>Name *</span>
                  <input
                    type="text"
                    value={playerForm.name ?? ''}
                    onChange={(e) =>
                      setPlayerForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. Alex Johnson"
                  />
                </label>
                <label>
                  <span>Position</span>
                  <input
                    type="text"
                    value={playerForm.position ?? ''}
                    onChange={(e) =>
                      setPlayerForm((prev) => ({ ...prev, position: e.target.value }))
                    }
                    placeholder="Guard, Striker, etc."
                  />
                </label>
                <label>
                  <span>Team</span>
                  <input
                    type="text"
                    value={playerForm.team ?? ''}
                    onChange={(e) =>
                      setPlayerForm((prev) => ({ ...prev, team: e.target.value }))
                    }
                    placeholder="Team name"
                  />
                </label>
              </div>
              <div className="form-actions">
                {editingPlayerId && (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => {
                      setEditingPlayerId(null);
                      setPlayerForm({});
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="primary-btn">
                  {editingPlayerId ? 'Save changes' : 'Add player'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Performances</h2>
            {selectedPlayer && (
              <span className="pill">
                {selectedPlayer.name}
                {selectedPlayer.team ? ` • ${selectedPlayer.team}` : ''}
              </span>
            )}
            {loadingPerformances && <span className="pill">Loading...</span>}
          </div>

          {!selectedPlayer && (
            <p className="muted">Select a player to see and log performances.</p>
          )}

          {selectedPlayer && (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Pts</th>
                      <th>Ast</th>
                      <th>Reb</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {performances.length === 0 && !loadingPerformances && (
                      <tr>
                        <td colSpan={6} className="muted">
                          No performances logged yet.
                        </td>
                      </tr>
                    )}
                    {performances.map((p) => (
                      <tr key={p.id}>
                        <td>{p.date}</td>
                        <td>{p.points}</td>
                        <td>{p.assists}</td>
                        <td>{p.rebounds}</td>
                        <td className="notes-cell">{p.notes}</td>
                        <td className="table-actions">
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => startEditPerformance(p)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="ghost-btn danger"
                            onClick={() => deletePerformance(p.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form className="form" onSubmit={handlePerformanceSubmit}>
                <h3>{editingPerformanceId ? 'Edit performance' : 'Log performance'}</h3>
                <div className="form-grid">
                  <label>
                    <span>Date *</span>
                    <input
                      type="date"
                      value={performanceForm.date ?? ''}
                      onChange={(e) =>
                        setPerformanceForm((prev) => ({ ...prev, date: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span>Points</span>
                    <input
                      type="number"
                      value={performanceForm.points ?? 0}
                      onChange={(e) =>
                        setPerformanceForm((prev) => ({
                          ...prev,
                          points: Number(e.target.value),
                        }))
                      }
                      min={0}
                    />
                  </label>
                  <label>
                    <span>Assists</span>
                    <input
                      type="number"
                      value={performanceForm.assists ?? 0}
                      onChange={(e) =>
                        setPerformanceForm((prev) => ({
                          ...prev,
                          assists: Number(e.target.value),
                        }))
                      }
                      min={0}
                    />
                  </label>
                  <label>
                    <span>Rebounds</span>
                    <input
                      type="number"
                      value={performanceForm.rebounds ?? 0}
                      onChange={(e) =>
                        setPerformanceForm((prev) => ({
                          ...prev,
                          rebounds: Number(e.target.value),
                        }))
                      }
                      min={0}
                    />
                  </label>
                  <label className="span-2">
                    <span>Notes</span>
                    <textarea
                      value={performanceForm.notes ?? ''}
                      onChange={(e) =>
                        setPerformanceForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Context, highlights, minutes played, etc."
                      rows={2}
                    />
                  </label>
                </div>
                <div className="form-actions">
                  {editingPerformanceId && (
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => {
                        setEditingPerformanceId(null);
                        setPerformanceForm({
                          date: new Date().toISOString().slice(0, 10),
                          player_id: selectedPlayer.id,
                        });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="primary-btn">
                    {editingPerformanceId ? 'Save changes' : 'Log performance'}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
