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

export default function Dashboard({ teams, onTeamClick, onViewAll, onViewRecruits, onViewGoalkeepers }) {
    const [data, setData] = useState(null)
    const [recruitCount, setRecruitCount] = useState(0)

    useEffect(() => {
        fetch(`${API}/dashboard`).then(r => r.json()).then(setData)
        fetch(`${API}/recruits`).then(r => r.json()).then(recruits => setRecruitCount(recruits.length))
    }, [])

    if (!data) return <p className="loading">Loading...</p>

    // Totals across all teams
    const totalMain = teams.reduce((sum, t) => sum + (data[t]?.main_squad || 0), 0)
    const totalFillin = teams.reduce((sum, t) => sum + (data[t]?.fill_ins || 0), 0)

    return (
        <div className="dashboard">
            <div className="dashboard-summary">
                <div className="summary-card">
                    <span className="summary-num">{totalMain}</span>
                    <span className="summary-label">Main Squad Players</span>
                </div>
                <div className="summary-card">
                    <span className="summary-num">{totalFillin}</span>
                    <span className="summary-label">Fill-in Appearances</span>
                </div>
            </div>

            <div className="team-grid">
                {/* All Players Tile */}
                <div className="team-card special-tile" onClick={onViewAll}>
                    <h2 className="team-card-title">📋 All Players</h2>
                    <div className="team-card-counts">
                        <span><strong>{totalMain}</strong> total players</span>
                    </div>
                </div>

                {/* Recruits Tile */}
                <div className="team-card special-tile" onClick={onViewRecruits}>
                    <h2 className="team-card-title">🎯 New Recruits</h2>
                    <div className="team-card-counts">
                        <span><strong>{recruitCount}</strong> recruits</span>
                    </div>
                </div>
                {/* Goalkeepers Tile */}
                <div className="team-card" onClick={onViewGoalkeepers} style={{background: '#10b981', color: '#fff'}}>
                    <h2 className="team-card-title">🧤 Goalkeepers</h2>
                    <div className="team-card-counts" style={{color: 'rgba(255,255,255,0.9)'}}>
                        <span>View all GKs</span>
                    </div>
                </div>

                {teams.map(team => {
                    const d = data[team] || {}
                    const breakdown = d.status_breakdown || {}
                    return (
                        <div key={team} className="team-card" onClick={() => onTeamClick(team)}>
                            <h2 className="team-card-title">{team}</h2>
                            <div className="team-card-counts">
                                <span><strong>{d.main_squad || 0}</strong> main</span>
                                <span><strong>{d.fill_ins || 0}</strong> fill-ins</span>
                            </div>
                            <div className="status-bar">
                                {Object.entries(STATUS_COLORS).map(([status, color]) => {
                                    const count = breakdown[status] || 0
                                    if (!count) return null
                                    const pct = (count / (d.main_squad || 1)) * 100
                                    return (
                                        <div
                                            key={status}
                                            className="status-bar-segment"
                                            style={{ width: `${pct}%`, backgroundColor: color }}
                                            title={`${status}: ${count}`}
                                        />
                                    )
                                })}
                            </div>
                            <div className="status-legend">
                                {Object.entries(STATUS_COLORS).map(([status, color]) => {
                                    const count = breakdown[status] || 0
                                    if (!count) return null
                                    return (
                                        <span key={status} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: color }} />
                                            {status} ({count})
                    </span>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}