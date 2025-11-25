import React, { useRef, useEffect, useState } from 'react'
import { getTeamLogo } from '../utils/teamLogos'
import './USMap.css'

const USMap = ({ teams, currentTeam, onTeamSelect, onSpin, isSpinning }) => {
  const [league, setLeague] = useState('mlb')
  const svgRef = useRef(null)
  const arrowRef = useRef(null)
  const spinningArrowRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 })
  const [spinData, setSpinData] = useState(null)

  // Detect league from current team
  useEffect(() => {
    if (currentTeam && currentTeam.league) {
      setLeague(currentTeam.league)
    }
  }, [currentTeam])

  // Calculate angle between two points
  const calculateAngle = (x1, y1, x2, y2) => {
    const dx = x2 - x1
    const dy = y2 - y1
    return (Math.atan2(dy, dx) * 180) / Math.PI
  }

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement
        if (container) {
          const rect = container.getBoundingClientRect()
          // Use fixed aspect ratio to prevent jittering
          const width = Math.min(rect.width, 1200)
          const height = width * 0.6 // 5:3 aspect ratio
          setDimensions({ width, height })
        }
      }
    }

    // Delay initial sizing to ensure DOM is ready
    setTimeout(handleResize, 100)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Get viewBox that matches the map bounds aspect ratio better
  const getViewBox = () => {
    return `0 0 ${dimensions.width} ${dimensions.height}`
  }

  const handleSpinClick = async () => {
    if (!currentTeam || isSpinning) return

    const data = await onSpin()
    if (data) {
      setSpinData(data)

      // Animate the spinning arrow around the current team
      const currentPoint = { x: currentTeam.x, y: currentTeam.y }
      const targetPoint = { x: data.targetTeam.x, y: data.targetTeam.y }
      const finalAngle = calculateAngle(currentPoint.x, currentPoint.y, targetPoint.x, targetPoint.y)

      if (spinningArrowRef.current) {
        spinningArrowRef.current.style.transition = `transform ${data.duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
        spinningArrowRef.current.style.transform = `rotate(${data.angle + finalAngle}deg)`

        setTimeout(() => {
          if (spinningArrowRef.current) {
            spinningArrowRef.current.style.transition = 'none'
            spinningArrowRef.current.style.transform = `rotate(${finalAngle}deg)`
          }
        }, data.duration)
      }

      // Also point the static arrow to the target
      if (arrowRef.current) {
        setTimeout(() => {
          if (arrowRef.current) {
            arrowRef.current.style.transform = `rotate(${finalAngle}deg)`
          }
        }, data.duration)
      }
    }
  }

  return (
    <div className="us-map-wrapper">
      <svg ref={svgRef} className="us-map" viewBox={getViewBox()} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Arrow marker */}
          <marker
            id="arrowhead"
            markerWidth="15"
            markerHeight="15"
            refX="12"
            refY="5"
            orient="auto"
          >
            <polygon points="0 0, 15 5, 0 10" fill="#ff6b6b" />
          </marker>
        </defs>

        {/* Background */}
        <rect width={dimensions.width} height={dimensions.height} fill="rgba(255, 255, 255, 0.05)" rx="10" />

        {/* US Map Image with team colors */}
        <image
          href={league === 'mlb' ? '/mlb-map.png' : '/nba-map.png'}
          x="0"
          y="0"
          width={dimensions.width}
          height={dimensions.height}
          opacity="0.6"
          preserveAspectRatio="xMidYMid meet"
          className="map-outline-image"
        />

        {/* Team markers */}
        {teams.map((team) => {
          const point = { x: team.x, y: team.y }
          const isCurrent = currentTeam?.id === team.id
          const logoSize = isCurrent ? 56 : 42
          const logoUrl = getTeamLogo(team.id, league)

          return (
            <g key={team.id}>
              {/* Glow effect for current team */}
              {isCurrent && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="35"
                  fill="none"
                  stroke="#ffd700"
                  strokeWidth="3"
                  opacity="0.6"
                  className="pulse"
                />
              )}

              {/* Team logo background circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r={logoSize / 2 + 2}
                fill="white"
                stroke={isCurrent ? '#ffd700' : 'rgba(255, 255, 255, 0.6)'}
                strokeWidth={isCurrent ? '4' : '2'}
                className="team-marker-bg"
                onClick={() => onTeamSelect(team)}
                style={{ cursor: isSpinning ? 'not-allowed' : 'pointer' }}
              />

              {/* Team logo image */}
              {logoUrl && (
                <image
                  href={logoUrl}
                  x={point.x - logoSize / 2}
                  y={point.y - logoSize / 2}
                  width={logoSize}
                  height={logoSize}
                  className="team-logo"
                  style={{ pointerEvents: 'none' }}
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    e.target.style.display = 'none'
                  }}
                />
              )}

              {/* Invisible click target over entire logo */}
              <circle
                cx={point.x}
                cy={point.y}
                r={logoSize / 2 + 5}
                fill="transparent"
                className="team-click-target"
                onClick={() => onTeamSelect(team)}
                style={{ cursor: isSpinning ? 'not-allowed' : 'pointer' }}
              />

              {/* Team name label below */}
              {isCurrent && (
                <text
                  x={point.x}
                  y={point.y + logoSize / 2 + 18}
                  textAnchor="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight="bold"
                  pointerEvents="none"
                  className="team-label"
                >
                  {team.city}
                </text>
              )}
            </g>
          )
        })}

        {/* Spinning arrow around current team */}
        {currentTeam && (
          <g
            ref={spinningArrowRef}
            style={{
              transformOrigin: `${currentTeam.x}px ${currentTeam.y}px`,
            }}
          >
            <line
              x1={currentTeam.x}
              y1={currentTeam.y}
              x2={currentTeam.x + 100}
              y2={currentTeam.y}
              stroke="#ff6b6b"
              strokeWidth="5"
              markerEnd="url(#arrowhead)"
              opacity={isSpinning ? "1" : "0.7"}
              className="spinning-arrow"
            />
          </g>
        )}
      </svg>

      <button className="map-spin-button" onClick={handleSpinClick} disabled={isSpinning || !currentTeam}>
        {isSpinning ? '🎯 Spinning...' : '🎯 Spin the Wheel!'}
      </button>
    </div>
  )
}

export default USMap
