import { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import PlayerList from './components/PlayerList'
import TeamPlanning from './components/TeamPlanning'
import PlayerDetail from './components/PlayerDetail'
import GoalkeeperView from './components/GoalkeeperView'

const API = '/api'

export default function App() {
    const [view, setView] = useState('dashboard')       // dashboard | team | list | detail | recruits
    const [selectedTeam, setSelectedTeam] = useState(null)
    const [selectedPlayer, setSelectedPlayer] = useState(null)
    const [teams, setTeams] = useState([])
    const [statuses, setStatuses] = useState([])
    const [positions, setPositions] = useState([])

    useEffect(() => {
        fetch(`${API}/teams`).then(r => r.json()).then(setTeams)
        fetch(`${API}/statuses`).then(r => r.json()).then(setStatuses)
        fetch(`${API}/positions`).then(r => r.json()).then(setPositions)
    }, [])

    // Navigation helpers
    const goToDashboard = () => { setView('dashboard'); setSelectedTeam(null); setSelectedPlayer(null) }
    const goToTeam = (team) => { setView('team'); setSelectedTeam(team); setSelectedPlayer(null) }
    const goToAllPlayers = () => { setView('list'); setSelectedTeam(null); setSelectedPlayer(null) }
    const goToRecruits = () => { setView('recruits'); setSelectedTeam(null); setSelectedPlayer(null) }
    const goToPlayer = (player) => { setView('detail'); setSelectedPlayer(player) }
    const goToGoalkeepers = () => { setView('goalkeepers'); setSelectedTeam(null); setSelectedPlayer(null) }
    const goBack = () => {
        if (view === 'detail') { 
            // Go back to previous view
            if (selectedTeam) setView('team')
            else if (view === 'recruits') setView('recruits')
            else setView('list')
            setSelectedPlayer(null)
        }
        else if (view === 'recruits' || view === 'team' || view === 'list') { 
            goToDashboard() 
        }
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
                    <Dashboard
                        teams={teams}
                        onTeamClick={goToTeam}
                        onViewAll={goToAllPlayers}
                        onViewRecruits={goToRecruits}
                        onViewGoalkeepers={goToGoalkeepers}
                    />
                )}
                {view === 'team' && (
                    <TeamPlanning
                        team={selectedTeam}
                        teams={teams}
                        onPlayerClick={goToPlayer}
                        onTeamChange={goToTeam}
                    />
                )}
                {view === 'list' && (
                    <PlayerList
                        team={selectedTeam}
                        teams={teams}
                        onPlayerClick={goToPlayer}
                        onTeamChange={goToTeam}
                    />
                )}
                {view === 'recruits' && (
                    <PlayerList
                        team={null}
                        teams={teams}
                        onPlayerClick={goToPlayer}
                        onTeamChange={goToTeam}
                        recruitsOnly={true}
                    />
                )}
                {view === 'detail' && (
                    <PlayerDetail
                        player={selectedPlayer}
                        teams={teams}
                        statuses={statuses}
                        positions={positions}
                        onBack={goBack}
                    />
                )}
                {view === 'goalkeepers' && (
                    <GoalkeeperView
                        teams={teams}
                        onPlayerClick={goToPlayer}
                    />
                )}
            </main>
        </div>
    )
}