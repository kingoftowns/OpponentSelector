import React, { useState, useRef, useEffect } from 'react'
import { getTeamLogo } from '../utils/teamLogos'
import './USMap.css'

const TeamPositioner = ({ teams: initialTeams, league }) => {
  const svgRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 1200, height: 720 })
  const [teams, setTeams] = useState([])
  const [draggingTeam, setDraggingTeam] = useState(null)

  // Initialize teams with default grid positions
  useEffect(() => {
    if (initialTeams && initialTeams.length > 0 && teams.length === 0) {
      const teamsWithPositions = initialTeams.map((t, i) => ({
        ...t,
        x: 150 + (i % 10) * 100,
        y: 150 + Math.floor(i / 10) * 80
      }))
      setTeams(teamsWithPositions)
    }
  }, [initialTeams, teams.length])

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement
        if (container) {
          const rect = container.getBoundingClientRect()
          const width = Math.min(rect.width, 1200)
          const height = width * 0.6
          setDimensions({ width, height })
        }
      }
    }

    setTimeout(handleResize, 100)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMouseDown = (team, e) => {
    e.preventDefault()
    setDraggingTeam(team.id)
  }

  const handleMouseMove = (e) => {
    if (!draggingTeam || !svgRef.current) return

    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())

    setTeams(teams.map(t =>
      t.id === draggingTeam
        ? { ...t, x: svgP.x, y: svgP.y }
        : t
    ))
  }

  const handleMouseUp = () => {
    setDraggingTeam(null)
  }

  const exportCoordinates = () => {
    const coordsText = teams.map(t =>
      `{ID: "${t.id}", Name: "${t.name}", City: "${t.city}", X: ${t.x.toFixed(1)}, Y: ${t.y.toFixed(1)}, Division: "${t.division}"}`
    ).join(',\n')

    console.log('Export coordinates:')
    console.log(coordsText)

    // Copy to clipboard
    navigator.clipboard.writeText(coordsText)
    alert('Coordinates copied to clipboard!')
  }

  return (
    <div className="us-map-wrapper" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px' }}>
        <h3>Team Positioner - {league.toUpperCase()}</h3>
        <p>Drag teams to position them on the map</p>
        <button onClick={exportCoordinates} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Export Coordinates
        </button>
      </div>

      <svg
        ref={svgRef}
        className="us-map"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect width={dimensions.width} height={dimensions.height} fill="rgba(255, 255, 255, 0.05)" rx="10" />

        {/* MLB/NBA Map Background */}
        <image
          href={league === 'mlb' ? '/mlb-map.png' : '/nba-map.png'}
          x="0"
          y="0"
          width={dimensions.width}
          height={dimensions.height}
          opacity="0.8"
          preserveAspectRatio="xMidYMid meet"
          className="map-outline-image"
        />

        {/* Team markers */}
        {teams.map((team) => {
          const logoSize = 42
          const logoUrl = getTeamLogo(team.id, league)

          return (
            <g
              key={team.id}
              onMouseDown={(e) => handleMouseDown(team, e)}
              style={{ cursor: 'move' }}
            >
              {/* Team logo background circle */}
              <circle
                cx={team.x || 100}
                cy={team.y || 100}
                r={logoSize / 2 + 2}
                fill="white"
                stroke="rgba(100, 100, 200, 0.8)"
                strokeWidth="2"
              />

              {/* Team logo image */}
              {logoUrl && (
                <image
                  href={logoUrl}
                  x={(team.x || 100) - logoSize / 2}
                  y={(team.y || 100) - logoSize / 2}
                  width={logoSize}
                  height={logoSize}
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Team label */}
              <text
                x={team.x || 100}
                y={(team.y || 100) + logoSize / 2 + 15}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="bold"
                pointerEvents="none"
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
              >
                {team.id}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default TeamPositioner
