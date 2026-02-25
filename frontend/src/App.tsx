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
  minutes: number;
  efficiency?: number;
  notes: string;
};

type Leader = {
  player: Player;
  avgPoints: number;
  games: number;
} | null;

type PlayerAverages = {
  player: Player;
  games: number;
  avgPoints: number;
  avgAssists: number;
  avgRebounds: number;
  avgMinutes: number;
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
    minutes: 0,
  });
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingPerformanceId, setEditingPerformanceId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leader, setLeader] = useState<Leader>(null);
  const [activePage, setActivePage] = useState<'players' | 'stats' | 'apply'>('apply');
  const [playerStats, setPlayerStats] = useState<PlayerAverages[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');
  const [applicationForm, setApplicationForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    team: '',
  });
  const [applicationStatus, setApplicationStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  const fetchLeader = async () => {
    try {
      const res = await fetch(`${API_BASE}/leader`);
      const data = await res.json();
      setLeader(data);
    } catch {
      // silently ignore leader errors to not block main UI
    }
  };

  const fetchPlayerStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/player-averages`);
      const data = await res.json();
      setPlayerStats(data);
    } catch {
      // ignore silently
    }
  };

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
    fetchLeader();
    fetchPlayerStats();
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
      await fetchLeader();
      await fetchPlayerStats();
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
          minutes: Number(performanceForm.minutes || 0),
          notes: performanceForm.notes || '',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save performance');
      }
      await fetchPerformances(selectedPlayer.id);
      await fetchLeader();
      await fetchPlayerStats();
      setPerformanceForm({
        date: new Date().toISOString().slice(0, 10),
        player_id: selectedPlayer.id,
        minutes: 0,
      });
      setEditingPerformanceId(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const startEditPerformance = (p: Performance) => {
    setEditingPerformanceId(p.id);
    setPerformanceForm({
      ...p,
      minutes: p.minutes ?? 0,
    });
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
        await fetchLeader();
        await fetchPlayerStats();
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleNavClick = (page: 'players' | 'stats' | 'apply') => {
    if (page === 'apply') {
      setActivePage('apply');
      return;
    }
    if (!isAdmin) {
      setActivePage('apply');
      setLoginError('Ai nevoie de cont admin/admin1 pentru a accesa această secțiune.');
      return;
    }
    setActivePage(page);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-top">
          <div>
            <h1>Player Performance Tracker</h1>
            <p className="subtitle">
              Track game-by-game impact with a clean, focused dashboard.
            </p>
          </div>
          <div className="header-staff-login">
            {!isAdmin ? (
              <>
                <span className="header-staff-label">Staff access</span>
                <input
                  type="text"
                  className="header-login-input"
                  placeholder="username"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                />
                <input
                  type="password"
                  className="header-login-input"
                  placeholder="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="ghost-btn header-login-btn"
                  onClick={() => {
                    if (loginForm.username === 'admin' && loginForm.password === 'admin1') {
                      setIsAdmin(true);
                      setLoginError(null);
                      setActivePage('players');
                    } else {
                      setIsAdmin(false);
                      setLoginError('Date de acces invalide.');
                      window.alert('Nume sau parolă greșită.');
                    }
                  }}
                >
                  Login
                </button>
              </>
            ) : (
              <span className="header-staff-label">Admin mode</span>
            )}
          </div>
        </div>
        <nav className="top-nav">
          {isAdmin && (
            <>
              <button
                type="button"
                className={`nav-tab ${activePage === 'players' ? 'nav-tab--active' : ''}`}
                onClick={() => handleNavClick('players')}
              >
                Players
              </button>
              <button
                type="button"
                className={`nav-tab ${activePage === 'stats' ? 'nav-tab--active' : ''}`}
                onClick={() => handleNavClick('stats')}
              >
                Stats
              </button>
            </>
          )}
          <button
            type="button"
            className={`nav-tab ${activePage === 'apply' ? 'nav-tab--active' : ''}`}
            onClick={() => handleNavClick('apply')}
          >
            Global Hoops
          </button>
        </nav>
      </header>

      <main className="layout">
        {activePage === 'players' && (
          <>
          <section className="card">
          <div className="card-header">
            <h2>Players</h2>
            {loadingPlayers && <span className="pill">Loading...</span>}
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="players-section">
            <div className="players-list">
              <div className="search-bar-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search players by name..."
                  value={playerSearchQuery}
                  onChange={(e) => setPlayerSearchQuery(e.target.value)}
                />
              </div>
              {players.length === 0 && !loadingPlayers && (
                <p className="muted">No players yet. Add your first player below.</p>
              )}
              <ul>
                {players
                  .filter((player) =>
                    player.name.toLowerCase().includes(playerSearchQuery.toLowerCase())
                  )
                  .map((player) => (
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
                {players.filter((player) =>
                  player.name.toLowerCase().includes(playerSearchQuery.toLowerCase())
                ).length === 0 && players.length > 0 && (
                  <li>
                    <p className="muted">No players found matching "{playerSearchQuery}"</p>
                  </li>
                )}
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

        <section className="card scouting-card">
          <div className="scouting-banner">
            <div className="scouting-logo">
              <div className="basketball-icon">🏀</div>
            </div>
            <h3 className="scouting-title">Global Hoops Scouting</h3>
            <p className="scouting-subtitle">
              Professional player performance tracking and analytics platform
            </p>
            <div className="scouting-stats">
              <div className="stat-item">
                <div className="stat-value">{players.length}</div>
                <div className="stat-label">Players</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {performances.length > 0 ? performances.length : 0}
                </div>
                <div className="stat-label">Games Tracked</div>
              </div>
            </div>
          </div>
        </section>
        </>
        )}

        {activePage === 'stats' && (
          <>
          <section className="card">
          <div className="card-header">
            <h2>Performances</h2>
            {selectedPlayer && (
              <span className="pill">
                {selectedPlayer.name}
                {selectedPlayer.team ? ` • ${selectedPlayer.team}` : ''}
              </span>
            )}
            {!selectedPlayer && <span className="pill">No player selected</span>}
            {loadingPerformances && <span className="pill">Loading...</span>}
          </div>

          {leader && (
            <div className="leader-badge">
              <div className="leader-label">Top scorer (avg points)</div>
              <div className="leader-name">
                {leader.player.name}
                {leader.player.team ? ` • ${leader.player.team}` : ''}
              </div>
              <div className="leader-meta">
                {leader.games} game{leader.games !== 1 ? 's' : ''} ·{' '}
                {leader.avgPoints.toFixed(1)} pts / game
              </div>
            </div>
          )}

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
                      <th>Min</th>
                      <th>Eff</th>
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
                        <td>{p.minutes ?? 0}</td>
                        <td>{p.efficiency ?? p.points + p.assists + p.rebounds}</td>
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
                  <label>
                    <span>Minutes</span>
                    <input
                      type="number"
                      value={performanceForm.minutes ?? 0}
                      onChange={(e) =>
                        setPerformanceForm((prev) => ({
                          ...prev,
                          minutes: Number(e.target.value),
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

        <section className="card">
          <div className="card-header">
            <h2>Per-player averages</h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Team</th>
                  <th>Games</th>
                  <th>Avg Pts</th>
                  <th>Avg Ast</th>
                  <th>Avg Reb</th>
                  <th>Avg Min</th>
                </tr>
              </thead>
              <tbody>
                {playerStats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      No data yet. Add performances to see averages.
                    </td>
                  </tr>
                )}
                {playerStats.map((row) => (
                  <tr key={row.player.id}>
                    <td>{row.player.name}</td>
                    <td>{row.player.team}</td>
                    <td>{row.games}</td>
                    <td>{row.avgPoints ? row.avgPoints.toFixed(1) : '0.0'}</td>
                    <td>{row.avgAssists ? row.avgAssists.toFixed(1) : '0.0'}</td>
                    <td>{row.avgRebounds ? row.avgRebounds.toFixed(1) : '0.0'}</td>
                    <td>{row.avgMinutes ? row.avgMinutes.toFixed(1) : '0.0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </>
        )}

        {activePage === 'apply' && (
          <>
            <section className="card">
              <div className="card-header">
                <h2>Despre Global Hoops Scouting</h2>
              </div>
              <div className="apply-intro">
                <p>
                  Suntem o agenție de <strong>scouting și analytics în baschet</strong> care îmbină
                  observația din sală cu date clare: puncte, eficiență, minute jucate și context
                  real de joc. Lucrăm cu cluburi și jucători care vor să înțeleagă mai bine
                  impactul lor pe teren.
                </p>
                <p>
                  Mai jos vezi un snapshot cu <strong>primele 3 medii de puncte pe meci</strong> din
                  baza de date actuală.
                </p>
              </div>

              <div className="table-wrapper apply-top-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Games</th>
                      <th>Avg Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats
                      .slice()
                      .sort((a, b) => b.avgPoints - a.avgPoints)
                      .slice(0, 3)
                      .map((row, idx) => (
                        <tr key={row.player.id}>
                          <td>{idx + 1}</td>
                          <td>{row.player.name}</td>
                          <td>{row.player.team}</td>
                          <td>{row.games}</td>
                          <td>{row.avgPoints ? row.avgPoints.toFixed(1) : '0.0'}</td>
                        </tr>
                      ))}
                    {playerStats.length === 0 && (
                      <tr>
                        <td colSpan={5} className="muted">
                          Încă nu avem suficiente date pentru a calcula top 3 la puncte pe meci.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Aplică în echipa noastră</h2>
              </div>
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    !applicationForm.firstName ||
                    !applicationForm.lastName ||
                    !applicationForm.email ||
                    !applicationForm.birthDate
                  ) {
                    setApplicationStatus('error');
                    return;
                  }
                  setApplicationStatus('success');
                  setApplicationForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    birthDate: '',
                    team: '',
                  });
                  // aici ai trimite datele spre backend / email
                }}
              >
                <h3>Formular aplicație</h3>
                <div className="form-grid">
                  <label>
                    <span>Prenume *</span>
                    <input
                      type="text"
                      value={applicationForm.firstName}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      placeholder="ex. Andrei"
                    />
                  </label>
                  <label>
                    <span>Nume *</span>
                    <input
                      type="text"
                      value={applicationForm.lastName}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      placeholder="ex. Popescu"
                    />
                  </label>
                  <label>
                    <span>Gmail *</span>
                    <input
                      type="email"
                      value={applicationForm.email}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="ex. nume.prenume@gmail.com"
                    />
                  </label>
                  <label>
                    <span>Data nașterii *</span>
                    <input
                      type="date"
                      value={applicationForm.birthDate}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({ ...prev, birthDate: e.target.value }))
                      }
                    />
                  </label>
                  <label className="span-2">
                    <span>Echipă / proiect actual</span>
                    <input
                      type="text"
                      value={applicationForm.team}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({ ...prev, team: e.target.value }))
                      }
                      placeholder="ex. CSU, Cluj, Dinamo sau alt club"
                    />
                  </label>
                </div>
                {applicationStatus === 'error' && (
                  <div className="error-banner">
                    Completează câmpurile marcate cu * înainte să trimiți formularul.
                  </div>
                )}
                {applicationStatus === 'success' && (
                  <div className="success-banner">
                    Cererea ta a fost trimisă. Îți mulțumim și revenim către tine pe email.
                  </div>
                )}
                <div className="form-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => {
                      setApplicationForm({
                        firstName: '',
                        lastName: '',
                        email: '',
                        birthDate: '',
                        team: '',
                      });
                      setApplicationStatus('idle');
                    }}
                  >
                    Reset
                  </button>
                  <button type="submit" className="primary-btn">
                    Trimite aplicația
                  </button>
                </div>
              </form>

            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
