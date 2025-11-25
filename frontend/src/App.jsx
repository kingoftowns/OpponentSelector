import React, { useState, useEffect } from 'react'
import USMap from './components/USMap'
import TeamPositioner from './components/TeamPositioner'
import './App.css'

function App() {
  const [league, setLeague] = useState('mlb')
  const [teams, setTeams] = useState([])
  const [currentTeam, setCurrentTeam] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [positionMode, setPositionMode] = useState(false)
  const [visitedTeams, setVisitedTeams] = useState([])
  const [gameComplete, setGameComplete] = useState(false)

  // Parse URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlLeague = params.get('league')
    const urlTeam = params.get('team')
    const positionModeParam = params.get('position')

    // Check for position mode
    if (positionModeParam === 'true') {
      setPositionMode(true)
    }

    if (urlLeague && (urlLeague === 'mlb' || urlLeague === 'nba')) {
      setLeague(urlLeague)
    }

    // Store the team parameter to set after teams are loaded
    if (urlTeam) {
      window._initialTeam = urlTeam
    }

    setInitialLoadComplete(true)
  }, [])

  useEffect(() => {
    if (initialLoadComplete) {
      fetchTeams(league)
    }
  }, [league, initialLoadComplete])

  const fetchTeams = async (selectedLeague) => {
    try {
      const response = await fetch(`/api/teams/${selectedLeague}`)
      const data = await response.json()
      setTeams(data)

      // Check if we have a team from URL parameters
      const urlTeamName = window._initialTeam
      let teamToSelect = null

      if (urlTeamName) {
        // Try to find team by name (case-insensitive)
        teamToSelect = data.find(
          (t) => t.name.toLowerCase() === urlTeamName.toLowerCase() ||
                 t.city.toLowerCase() === urlTeamName.toLowerCase() ||
                 t.id.toLowerCase() === urlTeamName.toLowerCase()
        )
        // Clear the stored team name after using it
        delete window._initialTeam
      }

      // Set current team: URL param team, existing team if league hasn't changed, or first team
      if (teamToSelect) {
        setCurrentTeam({ ...teamToSelect, league: selectedLeague })
      } else if (!currentTeam || currentTeam.league !== selectedLeague) {
        setCurrentTeam({ ...data[0], league: selectedLeague })
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handleSpin = async () => {
    if (isSpinning || !currentTeam || gameComplete) return

    setIsSpinning(true)

    try {
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentTeam: currentTeam.id,
          league: league,
          excludeTeams: visitedTeams,
        }),
      })

      const data = await response.json()

      // Trigger animation with the calculated result
      setTimeout(() => {
        const newTeam = { ...data.targetTeam, league }
        setCurrentTeam(newTeam)

        // Add the new team to visited teams
        const newVisitedTeams = [...visitedTeams, data.targetTeam.id]
        setVisitedTeams(newVisitedTeams)

        // Check if game is complete (all teams except starting team have been visited)
        if (newVisitedTeams.length >= teams.length - 1) {
          setGameComplete(true)
        }

        setIsSpinning(false)
      }, data.duration)

      return data
    } catch (error) {
      console.error('Error spinning:', error)
      setIsSpinning(false)
    }
  }

  const handleLeagueChange = (newLeague) => {
    if (isSpinning) return
    setLeague(newLeague)
    setCurrentTeam(null)
    setVisitedTeams([])
    setGameComplete(false)
  }

  const handleTeamSelect = (team) => {
    if (!isSpinning) {
      setCurrentTeam({ ...team, league })
    }
  }

  const handleNewGame = () => {
    setVisitedTeams([])
    setGameComplete(false)
    // Reset to first team in the list
    if (teams.length > 0) {
      setCurrentTeam({ ...teams[0], league })
    }
  }

  // If in position mode, show the positioner instead
  if (positionMode) {
    return (
      <div className="app">
        <div className="header">
          <h1>Team Positioning Mode</h1>
          <div className="league-toggle">
            <button
              className={league === 'mlb' ? 'active' : ''}
              onClick={() => handleLeagueChange('mlb')}
            >
              MLB
            </button>
            <button
              className={league === 'nba' ? 'active' : ''}
              onClick={() => handleLeagueChange('nba')}
            >
              NBA
            </button>
          </div>
        </div>

        <div className="map-container">
          <TeamPositioner teams={teams} league={league} />
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <button className="new-game-button" onClick={handleNewGame}>
          New Game
        </button>

        <div className="league-toggle">
          <button
            className={league === 'mlb' ? 'active' : ''}
            onClick={() => handleLeagueChange('mlb')}
            disabled={isSpinning}
          >
            MLB
          </button>
          <button
            className={league === 'nba' ? 'active' : ''}
            onClick={() => handleLeagueChange('nba')}
            disabled={isSpinning}
          >
            NBA
          </button>
        </div>

        {currentTeam && (
          <div className="current-team-header">
            {currentTeam.city} {currentTeam.name}
          </div>
        )}
      </div>

      <div className="map-container">
        {gameComplete && (
          <div className="game-complete-overlay">
            <div className="game-complete-message">
              <h1>🎉 Game Complete! 🎉</h1>
              <p>You've visited all {teams.length} teams!</p>
              <button onClick={handleNewGame} className="play-again-button">
                Play Again
              </button>
            </div>
          </div>
        )}

        <USMap
          teams={teams}
          currentTeam={currentTeam}
          onTeamSelect={handleTeamSelect}
          onSpin={handleSpin}
          isSpinning={isSpinning}
        />
      </div>
    </div>
  )
}

export default App
