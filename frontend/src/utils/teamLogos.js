// Team logo utility
// Using ESPN's CDN for team logos (publicly available)
const ESPN_CDN = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos'

export const getMLBLogo = (teamId) => {
  const mlbIds = {
    'LAD': '/mlb/500/lad.png',
    'NYY': '/mlb/500/nyy.png',
    'BOS': '/mlb/500/bos.png',
    'CHC': '/mlb/500/chc.png',
    'CWS': '/mlb/500/chw.png',
    'SF': '/mlb/500/sf.png',
    'MIA': '/mlb/500/mia.png',
    'ATL': '/mlb/500/atl.png',
    'PHI': '/mlb/500/phi.png',
    'WSH': '/mlb/500/wsh.png',
    'NYM': '/mlb/500/nym.png',
    'HOU': '/mlb/500/hou.png',
    'TEX': '/mlb/500/tex.png',
    'SEA': '/mlb/500/sea.png',
    'OAK': '/mlb/500/oak.png',
    'LAA': '/mlb/500/laa.png',
    'SD': '/mlb/500/sd.png',
    'ARI': '/mlb/500/ari.png',
    'COL': '/mlb/500/col.png',
    'STL': '/mlb/500/stl.png',
    'MIL': '/mlb/500/mil.png',
    'CIN': '/mlb/500/cin.png',
    'PIT': '/mlb/500/pit.png',
    'DET': '/mlb/500/det.png',
    'CLE': '/mlb/500/cle.png',
    'MIN': '/mlb/500/min.png',
    'KC': '/mlb/500/kc.png',
    'BAL': '/mlb/500/bal.png',
    'TB': '/mlb/500/tb.png',
    'TOR': '/mlb/500/tor.png',
  }

  return mlbIds[teamId] ? `${ESPN_CDN}${mlbIds[teamId]}&h=70&w=70` : null
}

export const getNBALogo = (teamId) => {
  const nbaIds = {
    'LAL': '/nba/500/lal.png',
    'LAC': '/nba/500/lac.png',
    'GSW': '/nba/500/gs.png',
    'SAC': '/nba/500/sac.png',
    'PHX': '/nba/500/phx.png',
    'POR': '/nba/500/por.png',
    'DEN': '/nba/500/den.png',
    'UTA': '/nba/500/utah.png',
    'OKC': '/nba/500/okc.png',
    'MIN': '/nba/500/min.png',
    'DAL': '/nba/500/dal.png',
    'HOU': '/nba/500/hou.png',
    'SAS': '/nba/500/sa.png',
    'MEM': '/nba/500/mem.png',
    'NOP': '/nba/500/no.png',
    'CHI': '/nba/500/chi.png',
    'CLE': '/nba/500/cle.png',
    'DET': '/nba/500/det.png',
    'IND': '/nba/500/ind.png',
    'MIL': '/nba/500/mil.png',
    'ATL': '/nba/500/atl.png',
    'CHA': '/nba/500/cha.png',
    'MIA': '/nba/500/mia.png',
    'ORL': '/nba/500/orl.png',
    'WAS': '/nba/500/wsh.png',
    'BOS': '/nba/500/bos.png',
    'BKN': '/nba/500/bkn.png',
    'NYK': '/nba/500/ny.png',
    'PHI': '/nba/500/phi.png',
    'TOR': '/nba/500/tor.png',
  }

  return nbaIds[teamId] ? `${ESPN_CDN}${nbaIds[teamId]}&h=70&w=70` : null
}

export const getTeamLogo = (teamId, league) => {
  return league === 'mlb' ? getMLBLogo(teamId) : getNBALogo(teamId)
}
