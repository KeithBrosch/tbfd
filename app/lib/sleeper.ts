/**
 * Sleeper API utilities for fetching comprehensive league data
 */

const SLEEPER_API_BASE = "https://api.sleeper.app/v1";

export interface Player {
  player_id: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string;
  nfl_team?: string;
  injury_status?: string;
  [key: string]: unknown;
}

export interface Roster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  wins: number;
  losses: number;
  ties?: number;
  fpts?: number;
  players?: string[]; // Array of player IDs
  [key: string]: unknown;
}

export interface User {
  user_id: string;
  display_name: string;
  avatar?: string;
  [key: string]: unknown;
}

export interface LeagueData {
  league_id: string;
  name: string;
  season: number;
  status: string;
  total_rosters: number;
  scoring_settings?: { [key: string]: unknown };
  roster_positions?: string[];
  league_average_match?: number;
  [key: string]: unknown;
}

export interface ComprehensiveLeagueData {
  league: LeagueData;
  rosters: Roster[];
  users: { [key: string]: User };
  players: { [key: string]: Player };
  ktcValues?: Record<string, {
    sleeperPlayerId: string;
    sleeperName: string;
    ktcName: string | null;
    ktcUrl: string | null;
    value: number | null;
    positionalRank: number | null;
    age: number | null;
    confidence: "exact" | "fuzzy" | "unmatched";
  }>;
}

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Fetch comprehensive league data from Sleeper API
 */
export async function fetchLeagueData(
  leagueId: string
): Promise<ComprehensiveLeagueData | ApiError> {
  try {
    if (!leagueId || leagueId.trim() === "") {
      return {
        message: "Please enter a valid Sleeper League ID",
        status: 400,
      };
    }

    const trimmedId = leagueId.trim();

    // Fetch league info, rosters, users, and players in parallel
    const [leagueRes, rostersRes, usersRes, playersRes] = await Promise.all([
      fetch(`${SLEEPER_API_BASE}/league/${trimmedId}`),
      fetch(`${SLEEPER_API_BASE}/league/${trimmedId}/rosters`),
      fetch(`${SLEEPER_API_BASE}/league/${trimmedId}/users`),
      fetch(`${SLEEPER_API_BASE}/players/nfl`),
    ]);

    // Check for errors
    if (!leagueRes.ok) {
      if (leagueRes.status === 404) {
        return {
          message: "League not found. Please check your League ID.",
          status: 404,
        };
      }
      return {
        message: `Error fetching league: ${leagueRes.statusText}`,
        status: leagueRes.status,
      };
    }

    if (!rostersRes.ok || !usersRes.ok) {
      return {
        message: "Failed to fetch league details",
        status: 500,
      };
    }

    const league = await leagueRes.json();
    const rosters = await rostersRes.json();
    const users = await usersRes.json();
    const players = playersRes.ok ? await playersRes.json() : {};

    return {
      league: league as LeagueData,
      rosters: rosters as Roster[],
      users: Object.fromEntries(
        (users as User[]).map((u) => [u.user_id, u])
      ),
      players: players as { [key: string]: Player },
    } as ComprehensiveLeagueData;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      message: `Failed to fetch league data: ${errorMessage}`,
    };
  }
}

/**
 * Get player name from player data
 */
export function getPlayerName(player: Player): string {
  if (player.first_name && player.last_name) {
    return `${player.first_name} ${player.last_name}`;
  }
  return "Unknown Player";
}

/**
 * Save league data to sessionStorage
 */
export function saveLeagueData(
  leagueId: string,
  data: ComprehensiveLeagueData
): void {
  try {
    // Store league, rosters, and users without full player data
    const compactData = {
      league: data.league,
      rosters: data.rosters,
      users: data.users,
      ktcValues: data.ktcValues,
    };
    sessionStorage.setItem(
      `sleeper_league_${leagueId}`,
      JSON.stringify(compactData)
    );

    // Store only essential player fields to minimize size
    const compactPlayers: { [key: string]: Record<string, unknown> } = {};
    for (const [playerId, player] of Object.entries(data.players)) {
      compactPlayers[playerId] = {
        first_name: player.first_name,
        last_name: player.last_name,
        position: player.position,
        team: player.team,
        nfl_team: player.nfl_team,
      };
    }
    sessionStorage.setItem(
      `sleeper_players_${leagueId}`,
      JSON.stringify(compactPlayers)
    );
    sessionStorage.setItem("sleeper_last_league_id", leagueId);
  } catch (error) {
    console.error("Failed to save league data to storage:", error);
  }
}

/**
 * Get league data from sessionStorage
 */
export function getLeagueData(
  leagueId: string
): ComprehensiveLeagueData | null {
  try {
    const data = sessionStorage.getItem(`sleeper_league_${leagueId}`);
    const playersData = sessionStorage.getItem(`sleeper_players_${leagueId}`);

    if (!data || !playersData) {
      return null;
    }

    const parsed = JSON.parse(data);
    const players = JSON.parse(playersData);

    return {
      league: parsed.league,
      rosters: parsed.rosters,
      users: parsed.users,
      players: players,
      ktcValues: parsed.ktcValues,
    } as ComprehensiveLeagueData;
  } catch (error) {
    console.error("Failed to retrieve league data from storage:", error);
    return null;
  }
}

/**
 * Restore the most recently loaded league from sessionStorage
 */
export function getLastLeagueData(): ComprehensiveLeagueData | null {
  try {
    const leagueId = sessionStorage.getItem("sleeper_last_league_id");
    return leagueId ? getLeagueData(leagueId) : null;
  } catch (error) {
    console.error("Failed to restore the last league from storage:", error);
    return null;
  }
}

/**
 * Clear league data from sessionStorage
 */
export function clearLeagueData(leagueId: string): void {
  try {
    sessionStorage.removeItem(`sleeper_league_${leagueId}`);
    sessionStorage.removeItem(`sleeper_players_${leagueId}`);
  } catch (error) {
    console.error("Failed to clear league data from storage:", error);
  }
}
