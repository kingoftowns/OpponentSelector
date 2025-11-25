package main

import (
	"log"
	"math"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Team struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	City     string  `json:"city"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	Division string  `json:"division"`
}

type SpinRequest struct {
	CurrentTeam string   `json:"currentTeam"`
	League      string   `json:"league"`
	ExcludeTeams []string `json:"excludeTeams"`
}

type SpinResponse struct {
	TargetTeam Team    `json:"targetTeam"`
	Angle      float64 `json:"angle"`
	Duration   int     `json:"duration"`
}

var mlbTeams = []Team{
	{ID: "SEA", Name: "Mariners", City: "Seattle", X: 235.6, Y: 116.5, Division: "AL West"},
	{ID: "SF", Name: "Giants", City: "San Francisco", X: 66.4, Y: 246.7, Division: "NL West"},
	{ID: "OAK", Name: "Athletics", City: "Oakland", X: 174.0, Y: 240.8, Division: "AL West"},
	{ID: "LAD", Name: "Dodgers", City: "Los Angeles", X: 135.0, Y: 385.1, Division: "NL West"},
	{ID: "LAA", Name: "Angels", City: "Anaheim", X: 228.5, Y: 394.6, Division: "AL West"},
	{ID: "SD", Name: "Padres", City: "San Diego", X: 201.3, Y: 462.1, Division: "NL West"},
	{ID: "COL", Name: "Rockies", City: "Denver", X: 420.2, Y: 252.6, Division: "NL West"},
	{ID: "ARI", Name: "Diamondbacks", City: "Phoenix", X: 331.4, Y: 438.4, Division: "NL West"},
	{ID: "TEX", Name: "Rangers", City: "Arlington", X: 557.4, Y: 473.9, Division: "AL West"},
	{ID: "HOU", Name: "Astros", City: "Houston", X: 642.6, Y: 576.8, Division: "AL West"},
	{ID: "MIN", Name: "Twins", City: "Minneapolis", X: 628.4, Y: 163.9, Division: "AL Central"},
	{ID: "MIL", Name: "Brewers", City: "Milwaukee", X: 779.9, Y: 201.7, Division: "NL Central"},
	{ID: "KC", Name: "Royals", City: "Kansas City", X: 632.0, Y: 327.2, Division: "AL Central"},
	{ID: "CHC", Name: "Cubs", City: "Chicago", X: 758.6, Y: 260.9, Division: "NL Central"},
	{ID: "CWS", Name: "White Sox", City: "Chicago", X: 810.6, Y: 282.2, Division: "AL Central"},
	{ID: "STL", Name: "Cardinals", City: "St. Louis", X: 752.6, Y: 369.8, Division: "NL Central"},
	{ID: "DET", Name: "Tigers", City: "Detroit", X: 861.5, Y: 202.9, Division: "AL Central"},
	{ID: "CLE", Name: "Guardians", City: "Cleveland", X: 898.2, Y: 256.2, Division: "AL Central"},
	{ID: "CIN", Name: "Reds", City: "Cincinnati", X: 858.0, Y: 329.5, Division: "NL Central"},
	{ID: "PIT", Name: "Pirates", City: "Pittsburgh", X: 949.1, Y: 275.1, Division: "NL Central"},
	{ID: "TOR", Name: "Blue Jays", City: "Toronto", X: 950.2, Y: 158.0, Division: "AL East"},
	{ID: "BOS", Name: "Red Sox", City: "Boston", X: 1097.0, Y: 136.7, Division: "AL East"},
	{ID: "NYY", Name: "Yankees", City: "New York", X: 1021.2, Y: 185.2, Division: "AL East"},
	{ID: "NYM", Name: "Mets", City: "New York", X: 1080.4, Y: 227.8, Division: "NL East"},
	{ID: "PHI", Name: "Phillies", City: "Philadelphia", X: 1001.1, Y: 243.2, Division: "NL East"},
	{ID: "BAL", Name: "Orioles", City: "Baltimore", X: 1037.8, Y: 302.3, Division: "AL East"},
	{ID: "WSH", Name: "Nationals", City: "Washington", X: 989.3, Y: 352.0, Division: "NL East"},
	{ID: "ATL", Name: "Braves", City: "Atlanta", X: 822.5, Y: 504.7, Division: "NL East"},
	{ID: "TB", Name: "Rays", City: "Tampa Bay", X: 919.5, Y: 572.1, Division: "AL East"},
	{ID: "MIA", Name: "Marlins", City: "Miami", X: 1010.6, Y: 637.2, Division: "NL East"},
}

var nbaTeams = []Team{
	{ID: "POR", Name: "Trail Blazers", City: "Portland", X: 200.1, Y: 122.5, Division: "Northwest"},
	{ID: "GSW", Name: "Warriors", City: "Golden State", X: 120.8, Y: 335.4, Division: "Pacific"},
	{ID: "SAC", Name: "Kings", City: "Sacramento", X: 176.4, Y: 259.7, Division: "Pacific"},
	{ID: "LAL", Name: "Lakers", City: "Los Angeles", X: 208.4, Y: 426.6, Division: "Pacific"},
	{ID: "LAC", Name: "Clippers", City: "Los Angeles", X: 175.2, Y: 378.0, Division: "Pacific"},
	{ID: "PHX", Name: "Suns", City: "Phoenix", X: 345.6, Y: 440.8, Division: "Pacific"},
	{ID: "UTA", Name: "Jazz", City: "Utah", X: 273.4, Y: 269.2, Division: "Northwest"},
	{ID: "DEN", Name: "Nuggets", City: "Denver", X: 482.9, Y: 285.8, Division: "Northwest"},
	{ID: "OKC", Name: "Thunder", City: "Oklahoma City", X: 581.1, Y: 401.7, Division: "Northwest"},
	{ID: "DAL", Name: "Mavericks", City: "Dallas", X: 603.6, Y: 501.1, Division: "Southwest"},
	{ID: "SAS", Name: "Spurs", City: "San Antonio", X: 546.8, Y: 560.3, Division: "Southwest"},
	{ID: "HOU", Name: "Rockets", City: "Houston", X: 647.3, Y: 555.5, Division: "Southwest"},
	{ID: "MEM", Name: "Grizzlies", City: "Memphis", X: 729.0, Y: 421.8, Division: "Southwest"},
	{ID: "NOP", Name: "Pelicans", City: "New Orleans", X: 752.6, Y: 541.3, Division: "Southwest"},
	{ID: "MIN", Name: "Timberwolves", City: "Minneapolis", X: 634.3, Y: 195.8, Division: "Northwest"},
	{ID: "MIL", Name: "Bucks", City: "Milwaukee", X: 744.4, Y: 220.7, Division: "Central"},
	{ID: "CHI", Name: "Bulls", City: "Chicago", X: 721.9, Y: 296.4, Division: "Central"},
	{ID: "DET", Name: "Pistons", City: "Detroit", X: 850.0, Y: 230.0, Division: "Central"},
	{ID: "CLE", Name: "Cavaliers", City: "Cleveland", X: 898.2, Y: 282.2, Division: "Central"},
	{ID: "IND", Name: "Pacers", City: "Indianapolis", X: 810.6, Y: 334.3, Division: "Central"},
	{ID: "TOR", Name: "Raptors", City: "Toronto", X: 947.9, Y: 198.2, Division: "Atlantic"},
	{ID: "BOS", Name: "Celtics", City: "Boston", X: 1070.9, Y: 123.6, Division: "Atlantic"},
	{ID: "NYK", Name: "Knicks", City: "New York", X: 1026.0, Y: 218.3, Division: "Atlantic"},
	{ID: "BKN", Name: "Nets", City: "Brooklyn", X: 1060.3, Y: 263.3, Division: "Atlantic"},
	{ID: "PHI", Name: "76ers", City: "Philadelphia", X: 983.4, Y: 259.7, Division: "Atlantic"},
	{ID: "WAS", Name: "Wizards", City: "Washington", X: 956.2, Y: 337.8, Division: "Southeast"},
	{ID: "CHA", Name: "Hornets", City: "Charlotte", X: 926.6, Y: 413.5, Division: "Southeast"},
	{ID: "ATL", Name: "Hawks", City: "Atlanta", X: 853.2, Y: 463.2, Division: "Southeast"},
	{ID: "ORL", Name: "Magic", City: "Orlando", X: 926.6, Y: 567.4, Division: "Southeast"},
	{ID: "MIA", Name: "Heat", City: "Miami", X: 970.4, Y: 649.0, Division: "Southeast"},
}

func main() {
	rand.Seed(time.Now().UnixNano())

	router := gin.Default()

	// CORS middleware
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:5173"}
	config.AllowMethods = []string{"GET", "POST", "OPTIONS"}
	router.Use(cors.New(config))

	router.GET("/api/teams/:league", getTeams)
	router.POST("/api/spin", spin)
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Println("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

func getTeams(c *gin.Context) {
	league := c.Param("league")

	var teams []Team
	switch league {
	case "mlb":
		teams = mlbTeams
	case "nba":
		teams = nbaTeams
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid league. Use 'mlb' or 'nba'"})
		return
	}

	c.JSON(http.StatusOK, teams)
}

func spin(c *gin.Context) {
	var req SpinRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var teams []Team
	switch req.League {
	case "mlb":
		teams = mlbTeams
	case "nba":
		teams = nbaTeams
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid league"})
		return
	}

	// Filter out excluded teams
	var availableTeams []Team
	for _, team := range teams {
		excluded := false
		for _, excludedID := range req.ExcludeTeams {
			if team.ID == excludedID {
				excluded = true
				break
			}
		}
		if !excluded && team.ID != req.CurrentTeam {
			availableTeams = append(availableTeams, team)
		}
	}

	if len(availableTeams) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No available teams"})
		return
	}

	// Find current team
	var currentTeam *Team
	for _, team := range teams {
		if team.ID == req.CurrentTeam {
			currentTeam = &team
			break
		}
	}
	if currentTeam == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Current team not found"})
		return
	}

	// Pick a random direction angle (0-360 degrees)
	randomAngle := rand.Float64() * 360.0

	// Convert angle to radians for calculation
	angleRad := randomAngle * math.Pi / 180.0

	// Find the closest team in this direction
	var targetTeam Team
	minDistance := math.MaxFloat64

	for _, team := range availableTeams {
		// Calculate vector from current team to this team
		dx := team.X - currentTeam.X
		dy := team.Y - currentTeam.Y

		// Calculate angle to this team (in radians)
		teamAngleRad := math.Atan2(dy, dx)

		// Normalize angles to [0, 2π)
		if teamAngleRad < 0 {
			teamAngleRad += 2 * math.Pi
		}
		normalizedRandomAngle := angleRad
		if normalizedRandomAngle < 0 {
			normalizedRandomAngle += 2 * math.Pi
		}

		// Calculate angular difference (accounting for wraparound)
		angleDiff := math.Abs(teamAngleRad - normalizedRandomAngle)
		if angleDiff > math.Pi {
			angleDiff = 2*math.Pi - angleDiff
		}

		// Only consider teams within a 45-degree cone (π/4 radians)
		if angleDiff <= math.Pi/4 {
			// Calculate actual distance
			distance := math.Sqrt(dx*dx + dy*dy)

			// Find closest team in this direction
			if distance < minDistance {
				minDistance = distance
				targetTeam = team
			}
		}
	}

	// If no team found in the cone, find the team with the closest angle
	if minDistance == math.MaxFloat64 {
		minAngleDiff := math.MaxFloat64
		for _, team := range availableTeams {
			dx := team.X - currentTeam.X
			dy := team.Y - currentTeam.Y
			teamAngleRad := math.Atan2(dy, dx)

			if teamAngleRad < 0 {
				teamAngleRad += 2 * math.Pi
			}
			normalizedRandomAngle := angleRad
			if normalizedRandomAngle < 0 {
				normalizedRandomAngle += 2 * math.Pi
			}

			angleDiff := math.Abs(teamAngleRad - normalizedRandomAngle)
			if angleDiff > math.Pi {
				angleDiff = 2*math.Pi - angleDiff
			}

			if angleDiff < minAngleDiff {
				minAngleDiff = angleDiff
				targetTeam = team
			}
		}
	}

	// Calculate a random number of full rotations (3-5) plus the final angle
	fullRotations := float64(3 + rand.Intn(3))
	totalAngle := (fullRotations * 360.0) + randomAngle

	// Duration in milliseconds (2-4 seconds)
	duration := 2000 + rand.Intn(2000)

	response := SpinResponse{
		TargetTeam: targetTeam,
		Angle:      totalAngle,
		Duration:   duration,
	}

	c.JSON(http.StatusOK, response)
}
