import { useState, useEffect } from 'react'

const API = '/api'

const STATUS_COLORS = {
    'Yes, planning to play': '#22c55e',        // Green
    'Unsure just yet': '#eab308',              // Yellow
    'Unlikely to play': '#a855f7',             // Purple
    'Fill-in / Emergency': '#3b82f6',          // Blue
    'New to club/restarting': '#06b6d4',       // Cyan
    'Not heard from': '#9ca3af',               // Grey
    'Not returning': '#ef4444',                // Red
}

export default function PlayerList({ team, teams, onPlayerClick, onTeamChange, recruitsOnly }) {
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [showRecruitsOnly, setShowRecruitsOnly] = useState(false)

    useEffect(() => {
        setLoading(true)
        const url = recruitsOnly 
            ? `${API}/recruits`
            : team ? `${API}/players?team=${team}` : `${API}/players`
        fetch(url)
            .then(r => r.json())
            .then(data => { setPlayers(data); setLoading(false) })
    }, [team, recruitsOnly])

    const filtered = players.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(filter.toLowerCase())
        const matchesRecruitFilter = !showRecruitsOnly || p.is_recruit === 1
        return matchesSearch && matchesRecruitFilter
    })

    // Split into main squad and fill-ins for this team
    const mainSquad = filtered.filter(p => p.main_team === team)
    const fillIns = filtered.filter(p => p.main_team !== team)

    return (
        <div className="player-list">
            <div className="list-header">
                <h2>{recruitsOnly ? 'New Recruits' : (team || 'All Players')}</h2>
                <div className="list-controls">
                    {!recruitsOnly && (
                        <select value={team || ''} onChange={e => onTeamChange(e.target.value || null)}>
                            <option value="">All Teams</option>
                            {teams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    )}
                    {!recruitsOnly && !team && (
                        <label className="checkbox-label">
                            <input 
                                type="checkbox" 
                                checked={showRecruitsOnly}
                                onChange={e => setShowRecruitsOnly(e.target.checked)}
                            />
                            <span>Recruits Only</span>
                        </label>
                    )}
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
                    {recruitsOnly && (
                        <PlayerTable players={filtered} onPlayerClick={onPlayerClick} showMainTeam />
                    )}
                    {!recruitsOnly && team && (
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
                    {!recruitsOnly && !team && (
                        <PlayerTable players={filtered} onPlayerClick={onPlayerClick} showMainTeam showAllFields />
                    )}
                </>
            )}
        </div>
    )
}

function PlayerTable({ players, onPlayerClick, showMainTeam, showAllFields }) {
    if (!players.length) return <p className="empty">No players</p>

    return (
        <table className="player-table">
            <thead>
            <tr>
                <th>#</th>
                <th>Player</th>
                {showAllFields && <th>Email</th>}
                {showAllFields && <th>Mobile</th>}
                {showMainTeam && <th>Main Team</th>}
                <th>Position</th>
                {!showAllFields && <th>Games</th>}
                <th>2026 Playing</th>
                {showAllFields && <th>Playing Availability</th>}
                {showAllFields && <th>Playing Preference</th>}
                {showAllFields && <th>Anything Else</th>}
                {showAllFields && <th>Follow Up OK?</th>}
                {showAllFields && <th>Reason Unsure</th>}
                {showAllFields && <th>What Describes You</th>}
                {showAllFields && <th>Interested In</th>}
                {showAllFields && <th>Club/Level Last</th>}
                {!showAllFields && <th>Also plays</th>}
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
                        {showAllFields && <td className="td-small">{p.email || '—'}</td>}
                        {showAllFields && <td className="td-small">{p.mobile || '—'}</td>}
                        {showMainTeam && <td>{p.main_team}</td>}
                        <td className="td-position">{p.position || '—'}</td>
                        {!showAllFields && <td>{mainApp?.games || 0}</td>}
                        <td>
                            <span className="status-badge" style={{ backgroundColor: STATUS_COLORS[p.status] + '22', color: STATUS_COLORS[p.status] }}>
                                {p.status}
                            </span>
                        </td>
                        {showAllFields && <td className="td-small">{p.playing_availability || '—'}</td>}
                        {showAllFields && <td className="td-small">{p.playing_preference || '—'}</td>}
                        {showAllFields && <td className="td-small">{p.anything_else || '—'}</td>}
                        {showAllFields && <td className="td-small">{p.happy_followup || '—'}</td>}
                        {showAllFields && <td className="td-small">{p.reason_unsure || '—'}</td>}
                        {showAllFields && <td className="td-small">{p.what_describes_you || '—'}</td>}
                        {showAllFields && <td className="td-small">{p.interested_in || '—'}</td>}
                        {showAllFields && <td className="td-small">{p.club_level_last || '—'}</td>}
                        {!showAllFields && <td className="td-also">{otherApps.map(a => `${a.team}(${a.games})`).join(', ') || '—'}</td>}
                    </tr>
                )
            })}
            </tbody>
        </table>
    )
}