// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      countries: {
        Row: {
          country_id: number;
          name: string;
          code: string;
          flag_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          country_id: number;
          name: string;
          code: string;
          flag_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          country_id?: number;
          name?: string;
          code?: string;
          flag_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      seasons: {
        Row: {
          season_year: number;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          season_year: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          season_year?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leagues: {
        Row: {
          league_id: number;
          name: string;
          country_id: number;
          season_year: number;
          type: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          league_id: number;
          name: string;
          country_id: number;
          season_year: number;
          type?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          league_id?: number;
          name?: string;
          country_id?: number;
          season_year?: number;
          type?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          team_id: number;
          name: string;
          country_id: number | null;
          founded_year: number | null;
          venue_id: number | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          team_id: number;
          name: string;
          country_id?: number | null;
          founded_year?: number | null;
          venue_id?: number | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          team_id?: number;
          name?: string;
          country_id?: number | null;
          founded_year?: number | null;
          venue_id?: number | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fixtures: {
        Row: {
          fixture_id: number;
          league_id: number;
          season_year: number;
          date_utc: string | null;
          status: string | null;
          home_team_id: number;
          away_team_id: number;
          venue_id: number | null;
          referee: string | null;
          home_goals: number | null;
          away_goals: number | null;
          updated_at: string;
        };
        Insert: {
          fixture_id: number;
          league_id: number;
          season_year: number;
          date_utc?: string | null;
          status?: string | null;
          home_team_id: number;
          away_team_id: number;
          venue_id?: number | null;
          referee?: string | null;
          home_goals?: number | null;
          away_goals?: number | null;
          updated_at?: string;
        };
        Update: {
          fixture_id?: number;
          league_id?: number;
          season_year?: number;
          date_utc?: string | null;
          status?: string | null;
          home_team_id?: number;
          away_team_id?: number;
          venue_id?: number | null;
          referee?: string | null;
          home_goals?: number | null;
          away_goals?: number | null;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          player_id: number;
          name: string;
          team_id: number | null;
          position: string | null;
          nationality: string | null;
          birth_date: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          player_id: number;
          name: string;
          team_id?: number | null;
          position?: string | null;
          nationality?: string | null;
          birth_date?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          player_id?: number;
          name?: string;
          team_id?: number | null;
          position?: string | null;
          nationality?: string | null;
          birth_date?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      odds_snapshots: {
        Row: {
          snapshot_id: string;
          fixture_id: number;
          bookmaker_id: number;
          bet_id: number;
          odds: number | null;
          overround: number | null;
          live: boolean | null;
          recorded_at: string;
        };
        Insert: {
          snapshot_id?: string;
          fixture_id: number;
          bookmaker_id: number;
          bet_id: number;
          odds?: number | null;
          overround?: number | null;
          live?: boolean | null;
          recorded_at?: string;
        };
        Update: {
          snapshot_id?: string;
          fixture_id?: number;
          bookmaker_id?: number;
          bet_id?: number;
          odds?: number | null;
          overround?: number | null;
          live?: boolean | null;
          recorded_at?: string;
        };
      };
      fixture_predictions: {
        Row: {
          fixture_id: number;
          prob_home: number | null;
          prob_draw: number | null;
          prob_away: number | null;
          model_version: string | null;
          created_at: string;
        };
        Insert: {
          fixture_id: number;
          prob_home?: number | null;
          prob_draw?: number | null;
          prob_away?: number | null;
          model_version?: string | null;
          created_at?: string;
        };
        Update: {
          fixture_id?: number;
          prob_home?: number | null;
          prob_draw?: number | null;
          prob_away?: number | null;
          model_version?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
