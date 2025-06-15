// App Configuration
export const APP_CONFIG = {
  name: 'F-Bet',
  version: '1.0.0',
  description: 'Football betting platform',
};

// API Configuration
export const API_CONFIG = {
  // These should be moved to environment variables in production
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'your-supabase-url',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key',
  apiFootballKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || 'your-api-football-key',
};

// Theme Colors
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',

  // Text colors
  textPrimary: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',

  // Background colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  errorBackground: '#FFF5F5',
  primaryLight: '#E3F2FD',

  // Border colors
  border: '#E5E5E7',
  divider: '#D1D1D6',

  // Shadow colors
  shadow: '#000000',

  // Status colors
  live: '#FF3B30',
  finished: '#34C759',
  scheduled: '#007AFF',
  postponed: '#FF9500',
  cancelled: '#FF3B30',
};

// Typography
export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  // Pre-defined text styles
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 1.4,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 1.4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 1.4,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 1.3,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 1.2,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 1.2,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

// Match Status
export const MATCH_STATUS = {
  SCHEDULED: 'NS', // Not Started
  LIVE: 'LIVE',
  HALFTIME: 'HT',
  FINISHED: 'FT',
  POSTPONED: 'PST',
  CANCELLED: 'CANC',
  SUSPENDED: 'SUSP',
  INTERRUPTED: 'INT',
} as const;

// Bet Types
export const BET_TYPES = {
  MATCH_WINNER: 'Match Winner',
  BOTH_TEAMS_TO_SCORE: 'Both Teams To Score',
  OVER_UNDER: 'Over/Under',
  ASIAN_HANDICAP: 'Asian Handicap',
  CORRECT_SCORE: 'Correct Score',
  FIRST_GOALSCORER: 'First Goalscorer',
} as const;

// Player Positions
export const PLAYER_POSITIONS = {
  GOALKEEPER: 'Goalkeeper',
  DEFENDER: 'Defender',
  MIDFIELDER: 'Midfielder',
  ATTACKER: 'Attacker',
} as const;

// Event Types
export const EVENT_TYPES = {
  GOAL: 'Goal',
  YELLOW_CARD: 'Card',
  RED_CARD: 'Card',
  SUBSTITUTION: 'subst',
  VAR: 'Var',
} as const;

// Screen Names
export const SCREEN_NAMES = {
  HOME: 'Home',
  FIXTURE_DETAIL: 'FixtureDetail',
  ODDS: 'Odds',
  PREDICTIONS: 'Predictions',
  TEAMS: 'Teams',
  PLAYERS: 'Players',
  LEAGUES: 'Leagues',
} as const;

// Tab Names
export const TAB_NAMES = {
  HOME: 'Home',
  FIXTURES: 'Fixtures',
  ODDS: 'Odds',
  PREDICTIONS: 'Predictions',
  MORE: 'More',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM dd, yyyy',
  DISPLAY_TIME: 'HH:mm',
  DISPLAY_DATETIME: 'MMM dd, yyyy HH:mm',
  API_DATE: 'yyyy-MM-dd',
  API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Animation Durations
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  FIXTURES: 'fixtures',
  FIXTURE_DETAIL: 'fixture-detail',
  TEAMS: 'teams',
  PLAYERS: 'players',
  LEAGUES: 'leagues',
  ODDS: 'odds',
  PREDICTIONS: 'predictions',
  TEAM_STATS: 'team-stats',
  PLAYER_STATS: 'player-stats',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  NO_DATA: 'No data available.',
  LOADING_ERROR: 'Failed to load data.',
} as const;
