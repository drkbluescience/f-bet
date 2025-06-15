// Database entity types based on the schema in README.md
export type { Database } from './database';

export interface Country {
  country_id: number;
  name: string;
  code: string;
  flag_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Season {
  season_year: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface League {
  league_id: number;
  name: string;
  country_id: number;
  season_year: number;
  type?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  country?: Country;
}

export interface Team {
  team_id: number;
  name: string;
  country_id?: number;
  founded_year?: number;
  venue_id?: number;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  country?: Country;
}

export interface TeamSeasonStats {
  league_id: number;
  season_year: number;
  team_id: number;
  matches_played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goals_for?: number;
  goals_against?: number;
  form?: string;
  updated_at: string;
  team?: Team;
  league?: League;
}

export interface Player {
  player_id: number;
  name: string;
  team_id?: number;
  position?: string;
  nationality?: string;
  birth_date?: string;
  height_cm?: number;
  weight_kg?: number;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface PlayerSeasonStats {
  player_id: number;
  league_id: number;
  season_year: number;
  matches?: number;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  minutes?: number;
  updated_at: string;
  player?: Player;
  league?: League;
}

export interface Fixture {
  fixture_id: number;
  league_id: number;
  season_year: number;
  date_utc?: string;
  status?: string;
  home_team_id: number;
  away_team_id: number;
  venue_id?: number;
  referee?: string;
  home_goals?: number | null;
  away_goals?: number | null;
  updated_at: string;
  home_team?: Team;
  away_team?: Team;
  league?: League;
  venue?: Venue;
}

export interface FixtureTeamStats {
  fixture_id: number;
  team_id: number;
  possession?: number;
  shots?: number;
  shots_on_goal?: number;
  corners?: number;
  fouls?: number;
  yellow_cards?: number;
  red_cards?: number;
  updated_at: string;
  team?: Team;
}

export interface FixtureEvent {
  event_id: string;
  fixture_id: number;
  minute?: number;
  team_id?: number;
  player_id?: number;
  type?: string;
  detail?: string;
  created_at: string;
  team?: Team;
  player?: Player;
}

export interface Bookmaker {
  bookmaker_id: number;
  name: string;
  country?: string;
  updated_at: string;
}

export interface BetMarket {
  bet_id: number;
  name?: string;
  updated_at: string;
}

export interface OddsSnapshot {
  snapshot_id: string;
  fixture_id: number;
  bookmaker_id: number;
  bet_id: number;
  odds?: number;
  overround?: number;
  live?: boolean;
  recorded_at: string;
  bookmaker?: Bookmaker;
  bet_market?: BetMarket;
}

export interface Venue {
  venue_id: number;
  name?: string;
  city?: string;
  country?: string;
  capacity?: number;
  surface?: string;
  latitude?: number;
  longitude?: number;
  updated_at: string;
}

export interface FixturePrediction {
  fixture_id: number;
  prob_home?: number;
  prob_draw?: number;
  prob_away?: number;
  model_version?: string;
  created_at: string;
  fixture?: Fixture;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  FixtureDetail: { fixtureId: number };
  Odds: { fixtureId?: number };
  Predictions: { fixtureId?: number };
  Teams: { leagueId?: number };
  Players: { teamId?: number };
  Leagues: undefined;
  Admin: undefined;
  TestData: undefined;
};

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// UI Component types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface FilterOptions {
  league_id?: number;
  season_year?: number;
  team_id?: number;
  date_from?: string;
  date_to?: string;
  status?: string;
}
