import { useState } from 'react'

const API = '/api'

export default function PlayerDetail({ player, teams, statuses, positions, onBack }) {
    const [status, setStatus] = useState(player.status)
    const [notes, setNotes] = useState(player.notes || '')
    const [position, setPosition] = useState(player.position || '')
    const [team2026, setTeam2026] = useState(player.team_2026 || '')
    const [saved, setSaved] = useState(false)
    const [appearances, setAppearances] = useState(player.appearances || [])
    const [addTeam, setAddTeam] = useState('')

    const mainApp = appearances.find(a => a.is_main)
    const otherApps = appearances.filter(a => !a.is_main)
    const availableTeams = teams.filter(t => !appearances.find(a => a.team === t))

    // Save status + notes + position + team_2026
    const handleSave = () => {
        fetch(`${API}/players/${player.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, notes, position: position || null, team_2026: team2026 || null }),
        })
            .then(r => r.json())
            .then(() => setSaved(true))
            .then(() => setTimeout(() => setSaved(false), 2000))
    }

    // Add fill-in appearance
    const handleAddAppearance = () => {
        if (!addTeam) return
        fetch(`${API}/players/${player.id}/appearances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team: addTeam, games: 0 }),
        })
            .then(r => r.json())
            .then(updated => { setAppearances(updated.appearances); setAddTeam('') })
    }

    // Remove fill-in appearance
    const handleRemoveAppearance = (team) => {
        fetch(`${API}/players/${player.id}/appearances/${team}`, { method: 'DELETE' })
            .then(() => setAppearances(prev => prev.filter(a => a.team !== team)))
    }

    // CSV / Sheet fields to display (non-empty only)
    const sheetFields = [
        { label: 'Email', value: player.email },
        { label: 'Mobile', value: player.mobile },
        { label: 'Playing availability', value: player.playing_availability },
        { label: 'Fill-in / emergency', value: player.fillin_emergency },
        { label: 'Follow up OK?', value: player.happy_followup },
        { label: 'Reason unsure', value: player.reason_unsure },
        { label: 'What describes you', value: player.what_describes_you },
        { label: 'Interested in', value: player.interested_in },
        { label: 'Club/level last played', value: player.club_level_last },
        { label: 'Main team last year', value: player.main_team_last_year },
        { label: 'Played last year?', value: player.did_play_last_year },
        { label: 'Club/grade last played', value: player.club_grade_last },
        { label: 'Playing preference', value: player.playing_preference },
        { label: 'Anything else', value: player.anything_else },
        { label: 'Submitted at', value: player.submitted_at },
    ].filter(f => f.value)

    return (
        <div className="player-detail">
            <div className="detail-header">
                <h2>{player.name}</h2>
                <span className="detail-main-team">Main: {player.main_team} ({mainApp?.games || 0} games)</span>
            </div>

            {/* Status + Notes + Position + Team 2026 — the main edit controls */}
            <div className="detail-edit">
                <div className="field">
                    <label>2026 Playing</label>
                    <select value={status} onChange={e => setStatus(e.target.value)}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label>Position</label>
                    <select value={position} onChange={e => setPosition(e.target.value)}>
                        <option value="">—</option>
                        {positions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label>2026 Team</label>
                    <select value={team2026} onChange={e => setTeam2026(e.target.value)}>
                        <option value="">—</option>
                        {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label>Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                </div>
                <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={handleSave}>
                    {saved ? '✓ Saved' : 'Save'}
                </button>
            </div>

            {/* Squad appearances */}
            <div className="detail-section">
                <h3>Squad Appearances</h3>
                <div className="appearances-list">
                    <div className="appearance-item main">
                        <span className="app-team">{mainApp?.team}</span>
                        <span className="app-games">{mainApp?.games} games</span>
                        <span className="app-badge">Main</span>
                    </div>
                    {otherApps.map(a => (
                        <div key={a.team} className="appearance-item">
                            <span className="app-team">{a.team}</span>
                            <span className="app-games">{a.games} games</span>
                            <button className="btn-remove" onClick={() => handleRemoveAppearance(a.team)}>✕</button>
                        </div>
                    ))}
                </div>
                {availableTeams.length > 0 && (
                    <div className="add-appearance">
                        <select value={addTeam} onChange={e => setAddTeam(e.target.value)}>
                            <option value="">Add fill-in...</option>
                            {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button className="btn-add" onClick={handleAddAppearance} disabled={!addTeam}>Add</button>
                    </div>
                )}
            </div>

            {/* Google Sheet data — read only */}
            {sheetFields.length > 0 && (
                <div className="detail-section">
                    <h3>Registration Data</h3>
                    <table className="sheet-data">
                        <tbody>
                        {sheetFields.map(f => (
                            <tr key={f.label}>
                                <td className="sheet-label">{f.label}</td>
                                <td className="sheet-value">{f.value}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}