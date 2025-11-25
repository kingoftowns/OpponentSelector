# US Sports Team Spinner

A web application that displays MLB and NBA teams on a US map with an interactive spin wheel to randomly select opponents. Built with Go backend and React frontend, designed for Kubernetes deployment.

## Features

- 🗺️ Interactive US map with team locations
- ⚾ MLB teams (all 30 teams)
- 🏀 NBA teams (all 30 teams)
- 🎯 Spin wheel mechanic with animated arrow
- 🎮 Game mode: spin to determine your next opponent
- 🔄 Toggle between MLB and NBA leagues
- 📍 Accurate geographic positioning of teams

## Architecture

- **Backend**: Go with Gin framework
- **Frontend**: React with Vite
- **Deployment**: Kubernetes with Docker containers

## Prerequisites

- Go 1.21+
- Node.js 18+
- Docker (for containerization)
- Kubernetes cluster (for production deployment)
- VSCode with Go extension (for debugging)

## Local Development

### Backend Setup

```bash
cd backend
go mod download
go run main.go
```

The backend will start on `http://localhost:8080`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

### URL Parameters

You can launch the app with a specific league and starting team using URL parameters:

```
http://localhost:3000?league=mlb&team=Dodgers
http://localhost:3000?league=nba&team=Lakers
```

**Parameters:**
- `league`: `mlb` or `nba` (optional, defaults to `mlb`)
- `team`: Team name, city, or ID (optional, defaults to first team)

**Examples:**
```
http://localhost:3000?league=mlb&team=Yankees
http://localhost:3000?league=mlb&team=NYY
http://localhost:3000?league=mlb&team=New York
http://localhost:3000?league=nba&team=Warriors
http://localhost:3000?league=nba&team=GSW
http://localhost:3000?league=nba&team=Golden State
```

The team parameter matches against:
- Team name (e.g., "Dodgers", "Lakers")
- City name (e.g., "Los Angeles", "Boston")
- Team ID (e.g., "LAD", "BOS")

All matches are case-insensitive.

## Debugging in VSCode

This project includes VSCode debug configurations:

1. **Launch Backend (Go)**: Debug the Go backend
2. **Launch Frontend (Chrome)**: Debug the React frontend in Chrome
3. **Launch Full Stack**: Debug both backend and frontend simultaneously

To debug:
1. Open the project in VSCode
2. Go to Run and Debug (Ctrl+Shift+D / Cmd+Shift+D)
3. Select "Launch Full Stack" from the dropdown
4. Press F5 or click the green play button

## API Endpoints

### Get Teams
```
GET /api/teams/:league
```
Parameters:
- `league`: "mlb" or "nba"

Returns: Array of team objects with id, name, city, lat, lng, and division

### Spin
```
POST /api/spin
```
Body:
```json
{
  "currentTeam": "LAD",
  "league": "mlb",
  "excludeTeams": []
}
```

Returns:
```json
{
  "targetTeam": {
    "id": "NYY",
    "name": "Yankees",
    "city": "New York",
    "lat": 40.8296,
    "lng": -73.9262,
    "division": "AL East"
  },
  "angle": 1234.5,
  "duration": 3000
}
```

## Building Docker Images

### Backend
```bash
cd backend
docker build -t us-map-backend:latest .
```

### Frontend
```bash
cd frontend
docker build -t us-map-frontend:latest .
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster running
- kubectl configured
- NGINX Ingress Controller installed

### Deploy to Kubernetes

```bash
# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy ingress (optional)
kubectl apply -f k8s/ingress.yaml
```

### Access the Application

If using the LoadBalancer service:
```bash
kubectl get svc us-map-frontend
```

Access the application at the EXTERNAL-IP shown.

If using Ingress:
Add to `/etc/hosts`:
```
<ingress-ip> us-map.local
```
Access at `http://us-map.local`

## Project Structure

```
us_map/
├── backend/
│   ├── main.go           # Backend application
│   ├── go.mod            # Go dependencies
│   └── Dockerfile        # Backend container image
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main React component
│   │   ├── components/
│   │   │   └── USMap.jsx # Map visualization component
│   │   └── main.jsx      # React entry point
│   ├── package.json      # Node dependencies
│   ├── vite.config.js    # Vite configuration
│   ├── nginx.conf        # Production nginx config
│   └── Dockerfile        # Frontend container image
├── k8s/
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── ingress.yaml
├── .vscode/
│   ├── launch.json       # Debug configurations
│   └── tasks.json        # VSCode tasks
└── README.md
```

## How It Works

1. **Select Starting Team**:
   - Launch with URL parameters: `?league=mlb&team=Dodgers`
   - Click on any team marker on the map
   - Defaults to the first team if no selection is made
2. **Toggle League**: Switch between MLB and NBA using the toggle buttons
3. **Spin**: Click the "Spin!" button to randomly select the next opponent
4. **Animation**: The arrow rotates with multiple full spins before pointing to the selected team
5. **Result**: The selected team becomes your next opponent and the starting point for the next spin

The backend pre-calculates the spin result (random team + rotation angle) before the frontend animates, ensuring a smooth, deterministic animation.

## Development Notes

- The backend calculates 3-5 full rotations plus a random final angle for engaging animation
- Team positions are based on actual stadium coordinates
- The arrow animation uses CSS transitions with cubic-bezier easing
- CORS is configured for local development
- Health check endpoint at `/api/health` for Kubernetes probes

## License

MIT
