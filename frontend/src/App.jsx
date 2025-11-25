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
    if (isSpinning || !currentTeam) return

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
          excludeTeams: [],
        }),
      })

      const data = await response.json()

      // Trigger animation with the calculated result
      setTimeout(() => {
        setCurrentTeam({ ...data.targetTeam, league })
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
  }

  const handleTeamSelect = (team) => {
    if (!isSpinning) {
      setCurrentTeam({ ...team, league })
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
