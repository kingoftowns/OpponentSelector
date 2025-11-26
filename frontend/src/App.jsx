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
  const [sessionId, setSessionId] = useState(null)
  const [gameComplete, setGameComplete] = useState(false)
  const [sessionEnabled, setSessionEnabled] = useState(false)

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
      // Try to restore session from localStorage
      const savedSessionId = localStorage.getItem('sessionId')
      if (savedSessionId) {
        restoreSession(savedSessionId)
      }
    }
  }, [league, initialLoadComplete])

  const restoreSession = async (savedSessionId) => {
    try {
      const response = await fetch(`/api/session/${savedSessionId}`)
      if (response.ok) {
        const session = await response.json()
        setSessionId(session.id)
        setGameComplete(session.gameComplete)

        // Only restore if it's the same league
        if (session.league === league) {
          // Find and set the current team
          const response = await fetch(`/api/teams/${league}`)
          const teams = await response.json()
          const team = teams.find(t => t.id === session.currentTeam)
          if (team) {
            setCurrentTeam({ ...team, league })
          }
        } else {
          // Different league, clear the session
          localStorage.removeItem('sessionId')
          setSessionId(null)
        }
      } else {
        // Session not found, clear it
        localStorage.removeItem('sessionId')
      }
    } catch (error) {
      console.error('Error restoring session:', error)
      localStorage.removeItem('sessionId')
    }
  }

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
          sessionId: sessionEnabled ? (sessionId || '') : '',
          currentTeam: currentTeam.id,
          league: league,
        }),
      })

      const data = await response.json()

      // Store session ID from backend only if session is enabled
      if (sessionEnabled && data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
        localStorage.setItem('sessionId', data.sessionId)
      }

      // Trigger animation with the calculated result
      setTimeout(() => {
        const newTeam = { ...data.targetTeam, league }
        setCurrentTeam(newTeam)

        // Update game complete state from backend only if session is enabled
        if (sessionEnabled && data.gameComplete) {
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

  const handleLeagueChange = async (newLeague) => {
    if (isSpinning) return
    setLeague(newLeague)
    setCurrentTeam(null)
    setGameComplete(false)

    // Clear session when changing leagues
    setSessionId(null)
    localStorage.removeItem('sessionId')
  }

  const handleTeamSelect = (team) => {
    if (!isSpinning) {
      setCurrentTeam({ ...team, league })
    }
  }

  const handleNewGame = async () => {
    setGameComplete(false)

    // Create new session on backend
    try {
      const response = await fetch('/api/session/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          league: league,
          currentTeam: teams.length > 0 ? teams[0].id : '',
        }),
      })

      const session = await response.json()
      setSessionId(session.id)
      localStorage.setItem('sessionId', session.id)

      // Reset to first team in the list
      if (teams.length > 0) {
        setCurrentTeam({ ...teams[0], league })
      }
    } catch (error) {
      console.error('Error creating new game:', error)
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
        <label className="session-toggle">
          <input
            type="checkbox"
            checked={sessionEnabled}
            onChange={(e) => {
              const enabled = e.target.checked
              setSessionEnabled(enabled)
              if (!enabled) {
                // Clear session when disabled
                setSessionId(null)
                setGameComplete(false)
                localStorage.removeItem('sessionId')
              } else {
                // Start new session when enabled
                handleNewGame()
              }
            }}
            disabled={isSpinning}
          />
          <span>Track Visited Teams</span>
        </label>

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
