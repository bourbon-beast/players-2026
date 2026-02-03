import { useState, useEffect } from 'react'

const API = '/api'

const STATUS_COLORS = {
    'Planning to play': '#22c55e',
    'Unsure': '#eab308',
    'Unlikely to play': '#a855f7',
    'Not heard from': '#9ca3af',
    'Not returning': '#ef4444',
    'Fill-in only': '#9ca3af',
}

export default function PlayerList({ team, teams, onPlayerClick, onTeamChange }) {
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        setLoading(true)
        const url = team ? `${API}/players?team=${team}` : `${API}/players`
        fetch(url)
            .then(r => r.json())
            .then(data => { setPlayers(data); setLoading(false) })
    }, [team])

    const filtered = players.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase())
    )

    // Split into main squad and fill-ins for this team
    const mainSquad = filtered.filter(p => p.main_team === team)
    const fillIns = filtered.filter(p => p.main_team !== team)

    return (
        <div className="player-list">
            <div className="list-header">
                <h2>{team || 'All Players'}</h2>
                <div className="list-controls">
                    <select value={team || ''} onChange={e => onTeamChange(e.target.value || null)}>
                        <option value="">All Teams</option>
                        {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {loading && <p className="loading">Loading...</p>}
            {!loading && (
                <>
                    {team && (
                        <>
                            <h3 className="section-heading">Main Squad — {mainSquad.length} players</h3>
                            <PlayerTable players={mainSquad} onPlayerClick={onPlayerClick} />

                            {fillIns.length > 0 && (
                                <>
                                    <h3 className="section-heading">Fill-ins — {fillIns.length}</h3>
                                    <PlayerTable players={fillIns} onPlayerClick={onPlayerClick} showMainTeam />
                                </>
                            )}
                        </>
                    )}
                    {!team && (
                        <PlayerTable players={filtered} onPlayerClick={onPlayerClick} showMainTeam />
                    )}
                </>
            )}
        </div>
    )
}

function PlayerTable({ players, onPlayerClick, showMainTeam }) {
    if (!players.length) return <p className="empty">No players</p>

    return (
        <table className="player-table">
            <thead>
            <tr>
                <th>#</th>
                <th>Player</th>
                {showMainTeam && <th>Main Team</th>}
                <th>Games</th>
                <th>Status</th>
                <th>Also plays</th>
            </tr>
            </thead>
            <tbody>
            {players.map((p, i) => {
                const mainApp = p.appearances?.find(a => a.is_main)
                const otherApps = p.appearances?.filter(a => !a.is_main) || []
                return (
                    <tr key={p.id} className="player-row" onClick={() => onPlayerClick(p)}>
                        <td className="td-num">{i + 1}</td>
                        <td className="td-name">{p.name}</td>
                        {showMainTeam && <td>{p.main_team}</td>}
                        <td>{mainApp?.games || 0}</td>
                        <td>
                <span className="status-badge" style={{ backgroundColor: STATUS_COLORS[p.status] + '22', color: STATUS_COLORS[p.status] }}>
                  {p.status}
                </span>
                        </td>
                        <td className="td-also">{otherApps.map(a => `${a.team}(${a.games})`).join(', ') || '—'}</td>
                    </tr>
                )
            })}
            </tbody>
        </table>
    )
}