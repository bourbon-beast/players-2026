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

export default function TeamPlanning({ team, teams, onPlayerClick, onTeamChange }) {
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

    const handlePositionChange = (playerId, newPosition) => {
        fetch(`${API}/players/${playerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: newPosition || null }),
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

    // 2025: Players who played for this team last year (main_team = team)
    const mainSquad2025 = allPlayers.filter(p => p.main_team === team && p.appearances?.some(a => a.is_main && a.team === team))
    const fillIns2025 = allPlayers.filter(p => {
        const hasFillinApp = p.appearances?.some(a => !a.is_main && a.team === team)
        const notMainForThisTeam = p.main_team !== team
        return hasFillinApp && notMainForThisTeam
    })

    // 2026: Players planned for this team (team_2026 = team)
    const squad2026 = allPlayers.filter(p => p.team_2026 === team)

    return (
        <div className="team-planning">
            <div className="planning-header">
                <h2>{team} — Squad Planning</h2>
                <div className="team-selector">
                    <select value={team || ''} onChange={e => onTeamChange(e.target.value || null)}>
                        {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {loading && <p className="loading">Loading...</p>}
            {!loading && (
                <div className="planning-grid">
                    <div className="planning-column">
                        <h3 className="column-heading">2025 Main Squad — {mainSquad2025.length} players</h3>
                        <SquadTable 
                            players={mainSquad2025} 
                            onPlayerClick={onPlayerClick} 
                            year="2025" 
                            teams={teams}
                            positions={['GK', 'Defender', 'Defensive Mid', 'Attacking Mid', 'Striker']}
                            statuses={['Yes, planning to play', 'Unsure just yet', 'Unlikely to play', 'Fill-in / Emergency', 'New to club/restarting', 'Not heard from', 'Not returning']}
                            onTeam2026Change={handleTeam2026Change}
                            onPositionChange={handlePositionChange}
                            onStatusChange={handleStatusChange}
                        />
                        
                        {fillIns2025.length > 0 && (
                            <>
                                <h3 className="column-heading" style={{ marginTop: '24px' }}>2025 Fill-ins — {fillIns2025.length} players</h3>
                                <SquadTable 
                                    players={fillIns2025} 
                                    onPlayerClick={onPlayerClick} 
                                    year="2025" 
                                    showMainTeam 
                                    currentTeam={team}
                                    teams={teams}
                                    positions={['GK', 'Defender', 'Defensive Mid', 'Attacking Mid', 'Striker']}
                                    statuses={['Yes, planning to play', 'Unsure just yet', 'Unlikely to play', 'Fill-in / Emergency', 'New to club/restarting', 'Not heard from', 'Not returning']}
                                    onTeam2026Change={handleTeam2026Change}
                                    onPositionChange={handlePositionChange}
                                    onStatusChange={handleStatusChange}
                                />
                            </>
                        )}
                    </div>

                    <div className="planning-column">
                        <h3 className="column-heading">2026 Squad (Planned) — {squad2026.length} players</h3>
                        <SquadTable 
                            players={squad2026} 
                            onPlayerClick={onPlayerClick} 
                            year="2026" 
                            teams={teams}
                            positions={['GK', 'Defender', 'Defensive Mid', 'Attacking Mid', 'Striker']}
                            statuses={['Yes, planning to play', 'Unsure just yet', 'Unlikely to play', 'Fill-in / Emergency', 'New to club/restarting', 'Not heard from', 'Not returning']}
                            onTeam2026Change={handleTeam2026Change}
                            onPositionChange={handlePositionChange}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

function SquadTable({ players, onPlayerClick, year, showMainTeam, currentTeam, teams, positions, statuses, onTeam2026Change, onPositionChange, onStatusChange }) {
    if (!players.length) return <p className="empty">No players assigned</p>

    // Sort by name
    const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name))

    const handleTeamChange = (e, playerId) => {
        if (onTeam2026Change) {
            onTeam2026Change(playerId, e.target.value)
        }
    }

    const handlePositionChange = (e, playerId) => {
        if (onPositionChange) {
            onPositionChange(playerId, e.target.value)
        }
    }

    const handleStatusChange = (e, playerId) => {
        if (onStatusChange) {
            onStatusChange(playerId, e.target.value)
        }
    }

    return (
        <table className="squad-table">
            <thead>
            <tr>
                <th>#</th>
                <th>Player</th>
                {showMainTeam && <th>Main Team</th>}
                <th>Position</th>
                {year === '2025' && <th>Games</th>}
                <th>2026 Playing</th>
                {onTeam2026Change && <th>2026 Team</th>}
            </tr>
            </thead>
            <tbody>
            {sorted.map((p, i) => {
                // For fill-ins (showMainTeam), show games for currentTeam, not main team
                const mainApp = p.appearances?.find(a => a.is_main)
                const teamApp = currentTeam ? p.appearances?.find(a => a.team === currentTeam) : null
                const gamesCount = showMainTeam && teamApp ? teamApp.games : (mainApp?.games || 0)
                
                return (
                    <tr key={p.id} className="player-row">
                        <td className="td-num">{i + 1}</td>
                        <td className="td-name" onClick={() => onPlayerClick(p)} style={{ cursor: 'pointer' }}>{p.name}</td>
                        {showMainTeam && <td>{p.main_team}</td>}
                        <td>
                            {onPositionChange ? (
                                <select 
                                    value={p.position || ''} 
                                    onChange={(e) => handlePositionChange(e, p.id)}
                                    className="inline-select"
                                >
                                    <option value="">—</option>
                                    {positions && positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                                </select>
                            ) : (
                                <span className="td-position">{p.position || '—'}</span>
                            )}
                        </td>
                        {year === '2025' && <td>{gamesCount}</td>}
                        <td>
                            {onStatusChange ? (
                                <select 
                                    value={p.status || ''} 
                                    onChange={(e) => handleStatusChange(e, p.id)}
                                    className="inline-select"
                                    style={{ 
                                        backgroundColor: STATUS_COLORS[p.status] + '22', 
                                        color: STATUS_COLORS[p.status],
                                        fontWeight: '500',
                                        border: `1px solid ${STATUS_COLORS[p.status]}44`
                                    }}
                                >
                                    {statuses && statuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            ) : (
                                <span 
                                    className="status-badge" 
                                    style={{ 
                                        backgroundColor: STATUS_COLORS[p.status] + '22', 
                                        color: STATUS_COLORS[p.status] 
                                    }}
                                >
                                    {p.status}
                                </span>
                            )}
                        </td>
                        {onTeam2026Change && (
                            <td>
                                <select 
                                    value={p.team_2026 || ''} 
                                    onChange={(e) => handleTeamChange(e, p.id)}
                                    className="inline-select"
                                >
                                    <option value="">—</option>
                                    {teams && teams.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </td>
                        )}
                    </tr>
                )
            })}
            </tbody>
        </table>
    )
}
