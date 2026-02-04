import { useState, useEffect } from 'react'

const API = '/api'

const STATUS_COLORS = {
    'Yes, planning to play': '#22c55e',
    'Unsure just yet': '#eab308',
    'Unlikely to play': '#a855f7',
    'Fill-in / Emergency': '#3b82f6',
    'New to club/restarting': '#06b6d4',
    'Not heard from': '#9ca3af',
    'Not returning': '#ef4444',
}

export default function GoalkeeperView({ teams, onPlayerClick }) {
    const [allPlayers, setAllPlayers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPlayers()
    }, [])

    const loadPlayers = () => {
        setLoading(true)
        fetch(`${API}/players`)
            .then(r => r.json())
            .then(data => { setAllPlayers(data); setLoading(false) })
    }

    const handleTeam2026Change = (playerId, newTeam) => {
        fetch(`${API}/players/${playerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team_2026: newTeam || null }),
        })
            .then(r => r.json())
            .then(() => loadPlayers())
    }

    const handleStatusChange = (playerId, newStatus) => {
        fetch(`${API}/players/${playerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        })
            .then(r => r.json())
            .then(() => loadPlayers())
    }

    // Filter for goalkeepers only
    const goalkeepers = allPlayers.filter(p => p.position === 'GK')

    return (
        <div className="team-planning">
            <div className="planning-header">
                <h2>All Goalkeepers — {goalkeepers.length} players</h2>
            </div>

            {loading && <p className="loading">Loading...</p>}
            {!loading && (
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <table className="squad-table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Main Team (2025)</th>
                            <th>Games (2025)</th>
                            <th>2026 Playing</th>
                            <th>2026 Team</th>
                        </tr>
                        </thead>
                        <tbody>
                        {goalkeepers.sort((a, b) => a.name.localeCompare(b.name)).map((p, i) => {
                            const mainApp = p.appearances?.find(a => a.is_main)
                            return (
                                <tr key={p.id} className="player-row">
                                    <td className="td-num">{i + 1}</td>
                                    <td className="td-name" onClick={() => onPlayerClick(p)} style={{ cursor: 'pointer' }}>{p.name}</td>
                                    <td>{p.main_team || '—'}</td>
                                    <td>{mainApp?.games || 0}</td>
                                    <td>
                                        <select
                                            value={p.status || ''}
                                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                                            className="inline-select"
                                            style={{
                                                backgroundColor: STATUS_COLORS[p.status] + '22',
                                                color: STATUS_COLORS[p.status],
                                                fontWeight: '500',
                                                border: `1px solid ${STATUS_COLORS[p.status]}44`
                                            }}
                                        >
                                            <option value="Yes, planning to play">Yes, planning to play</option>
                                            <option value="Unsure just yet">Unsure just yet</option>
                                            <option value="Unlikely to play">Unlikely to play</option>
                                            <option value="Fill-in / Emergency">Fill-in / Emergency</option>
                                            <option value="New to club/restarting">New to club/restarting</option>
                                            <option value="Not heard from">Not heard from</option>
                                            <option value="Not returning">Not returning</option>
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={p.team_2026 || ''}
                                            onChange={(e) => handleTeam2026Change(p.id, e.target.value)}
                                            className="inline-select"
                                        >
                                            <option value="">—</option>
                                            {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>

                    {goalkeepers.length === 0 && (
                        <p className="empty">No goalkeepers found. Set player positions to "GK" to see them here.</p>
                    )}
                </div>
            )}
        </div>
    )
}