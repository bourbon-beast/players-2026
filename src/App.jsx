import { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import PlayerList from './components/PlayerList'
import PlayerDetail from './components/PlayerDetail'

const API = '/api'

export default function App() {
    const [view, setView] = useState('dashboard')       // dashboard | list | detail
    const [selectedTeam, setSelectedTeam] = useState(null)
    const [selectedPlayer, setSelectedPlayer] = useState(null)
    const [teams, setTeams] = useState([])
    const [statuses, setStatuses] = useState([])

    useEffect(() => {
        fetch(`${API}/teams`).then(r => r.json()).then(setTeams)
        fetch(`${API}/statuses`).then(r => r.json()).then(setStatuses)
    }, [])

    // Navigation helpers
    const goToDashboard = () => { setView('dashboard'); setSelectedTeam(null); setSelectedPlayer(null) }
    const goToTeam = (team) => { setView('list'); setSelectedTeam(team); setSelectedPlayer(null) }
    const goToPlayer = (player) => { setView('detail'); setSelectedPlayer(player) }
    const goBack = () => {
        if (view === 'detail') { setView('list'); setSelectedPlayer(null) }
        else { goToDashboard() }
    }

    return (
        <div className="app">
            <nav className="nav">
                <h1 className="nav-title" onClick={goToDashboard}>MHC Men's 2026</h1>
                {(view !== 'dashboard') && <button className="btn-back" onClick={goBack}>← Back</button>}
            </nav>

            <main className="main">
                {view === 'dashboard' && (
                    <Dashboard teams={teams} onTeamClick={goToTeam} />
                )}
                {view === 'list' && (
                    <PlayerList
                        team={selectedTeam}
                        teams={teams}
                        onPlayerClick={goToPlayer}
                        onTeamChange={goToTeam}
                    />
                )}
                {view === 'detail' && (
                    <PlayerDetail
                        player={selectedPlayer}
                        teams={teams}
                        statuses={statuses}
                        onBack={goBack}
                    />
                )}
            </main>
        </div>
    )
}