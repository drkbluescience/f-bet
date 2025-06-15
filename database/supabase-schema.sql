-- F-Bet Database Schema for Supabase
-- API-Football Integration Tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(3),
    flag TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50),
    logo TEXT,
    country_id INTEGER REFERENCES countries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id),
    year INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    current BOOLEAN DEFAULT FALSE,
    coverage JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, year)
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    capacity INTEGER,
    surface VARCHAR(50),
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(10),
    country VARCHAR(100),
    founded INTEGER,
    national BOOLEAN DEFAULT FALSE,
    logo TEXT,
    venue_id INTEGER REFERENCES venues(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    age INTEGER,
    birth_date DATE,
    birth_place VARCHAR(200),
    birth_country VARCHAR(100),
    nationality VARCHAR(100),
    height VARCHAR(10),
    weight VARCHAR(10),
    injured BOOLEAN DEFAULT FALSE,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team squads (many-to-many relationship between teams and players)
CREATE TABLE IF NOT EXISTS team_squads (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    player_id INTEGER REFERENCES players(id),
    season_year INTEGER,
    position VARCHAR(50),
    number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, player_id, season_year)
);

-- Fixtures table
CREATE TABLE IF NOT EXISTS fixtures (
    id INTEGER PRIMARY KEY,
    referee VARCHAR(200),
    timezone VARCHAR(50),
    date TIMESTAMP WITH TIME ZONE,
    timestamp BIGINT,
    venue_id INTEGER REFERENCES venues(id),
    status_long VARCHAR(50),
    status_short VARCHAR(10),
    status_elapsed INTEGER,
    league_id INTEGER REFERENCES leagues(id),
    season_year INTEGER,
    round VARCHAR(100),
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    home_goals INTEGER,
    away_goals INTEGER,
    home_goals_halftime INTEGER,
    away_goals_halftime INTEGER,
    home_goals_extratime INTEGER,
    away_goals_extratime INTEGER,
    home_goals_penalty INTEGER,
    away_goals_penalty INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixture events table
CREATE TABLE IF NOT EXISTS fixture_events (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES fixtures(id),
    time_elapsed INTEGER,
    time_extra INTEGER,
    team_id INTEGER REFERENCES teams(id),
    player_id INTEGER REFERENCES players(id),
    assist_id INTEGER REFERENCES players(id),
    type VARCHAR(50),
    detail VARCHAR(100),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixture lineups table
CREATE TABLE IF NOT EXISTS fixture_lineups (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES fixtures(id),
    team_id INTEGER REFERENCES teams(id),
    formation VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixture lineup players table
CREATE TABLE IF NOT EXISTS fixture_lineup_players (
    id SERIAL PRIMARY KEY,
    lineup_id INTEGER REFERENCES fixture_lineups(id),
    player_id INTEGER REFERENCES players(id),
    number INTEGER,
    position VARCHAR(50),
    grid VARCHAR(10),
    substitute BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixture statistics table
CREATE TABLE IF NOT EXISTS fixture_statistics (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES fixtures(id),
    team_id INTEGER REFERENCES teams(id),
    type VARCHAR(100),
    value VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League standings table
CREATE TABLE IF NOT EXISTS league_standings (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id),
    season_year INTEGER,
    team_id INTEGER REFERENCES teams(id),
    rank INTEGER,
    points INTEGER,
    goalsDiff INTEGER,
    group_name VARCHAR(50),
    form VARCHAR(10),
    status VARCHAR(50),
    description TEXT,
    played INTEGER,
    win INTEGER,
    draw INTEGER,
    lose INTEGER,
    goals_for INTEGER,
    goals_against INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, season_year, team_id)
);

-- Team statistics table
CREATE TABLE IF NOT EXISTS team_statistics (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    league_id INTEGER REFERENCES leagues(id),
    season_year INTEGER,
    form VARCHAR(10),
    fixtures_played_home INTEGER,
    fixtures_played_away INTEGER,
    fixtures_played_total INTEGER,
    fixtures_wins_home INTEGER,
    fixtures_wins_away INTEGER,
    fixtures_wins_total INTEGER,
    fixtures_draws_home INTEGER,
    fixtures_draws_away INTEGER,
    fixtures_draws_total INTEGER,
    fixtures_loses_home INTEGER,
    fixtures_loses_away INTEGER,
    fixtures_loses_total INTEGER,
    goals_for_total_home INTEGER,
    goals_for_total_away INTEGER,
    goals_for_total_total INTEGER,
    goals_against_total_home INTEGER,
    goals_against_total_away INTEGER,
    goals_against_total_total INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, league_id, season_year)
);

-- Player statistics table
CREATE TABLE IF NOT EXISTS player_statistics (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    team_id INTEGER REFERENCES teams(id),
    league_id INTEGER REFERENCES leagues(id),
    season_year INTEGER,
    position VARCHAR(50),
    rating VARCHAR(10),
    captain BOOLEAN DEFAULT FALSE,
    appearances INTEGER,
    lineups INTEGER,
    minutes INTEGER,
    substitutes_in INTEGER,
    substitutes_out INTEGER,
    substitutes_bench INTEGER,
    goals_total INTEGER,
    goals_conceded INTEGER,
    assists INTEGER,
    saves INTEGER,
    passes_total INTEGER,
    passes_key INTEGER,
    passes_accuracy INTEGER,
    tackles_total INTEGER,
    tackles_blocks INTEGER,
    tackles_interceptions INTEGER,
    duels_total INTEGER,
    duels_won INTEGER,
    dribbles_attempts INTEGER,
    dribbles_success INTEGER,
    dribbles_past INTEGER,
    fouls_drawn INTEGER,
    fouls_committed INTEGER,
    cards_yellow INTEGER,
    cards_yellowred INTEGER,
    cards_red INTEGER,
    penalty_won INTEGER,
    penalty_committed INTEGER,
    penalty_scored INTEGER,
    penalty_missed INTEGER,
    penalty_saved INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, team_id, league_id, season_year)
);

-- Bookmakers table
CREATE TABLE IF NOT EXISTS bookmakers (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Odds table
CREATE TABLE IF NOT EXISTS odds (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES fixtures(id),
    bookmaker_id INTEGER REFERENCES bookmakers(id),
    bet_name VARCHAR(100),
    bet_id INTEGER,
    values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES fixtures(id),
    winner_id INTEGER REFERENCES teams(id),
    winner_comment TEXT,
    win_or_draw BOOLEAN,
    under_over VARCHAR(10),
    goals_home VARCHAR(10),
    goals_away VARCHAR(10),
    advice TEXT,
    percent_home INTEGER,
    percent_draw INTEGER,
    percent_away INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fixture_id)
);

-- Prediction comparison table
CREATE TABLE IF NOT EXISTS prediction_comparison (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES fixtures(id),
    home_team_form VARCHAR(10),
    away_team_form VARCHAR(10),
    home_team_att VARCHAR(10),
    away_team_att VARCHAR(10),
    home_team_def VARCHAR(10),
    away_team_def VARCHAR(10),
    home_team_poisson_distribution VARCHAR(10),
    away_team_poisson_distribution VARCHAR(10),
    home_team_h2h VARCHAR(10),
    away_team_h2h VARCHAR(10),
    home_team_goals_h2h VARCHAR(10),
    away_team_goals_h2h VARCHAR(10),
    home_team_total VARCHAR(10),
    away_team_total VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fixture_id)
);

-- Transfers table
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    date DATE,
    type VARCHAR(50),
    team_in_id INTEGER REFERENCES teams(id),
    team_out_id INTEGER REFERENCES teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Injuries table
CREATE TABLE IF NOT EXISTS injuries (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    team_id INTEGER REFERENCES teams(id),
    fixture_id INTEGER REFERENCES fixtures(id),
    type VARCHAR(100),
    reason VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coaches table
CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    age INTEGER,
    birth_date DATE,
    birth_place VARCHAR(200),
    birth_country VARCHAR(100),
    nationality VARCHAR(100),
    height VARCHAR(10),
    weight VARCHAR(10),
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team coaches table
CREATE TABLE IF NOT EXISTS team_coaches (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    coach_id INTEGER REFERENCES coaches(id),
    season_year INTEGER,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data sync logs table for tracking data synchronization operations
CREATE TABLE IF NOT EXISTS data_sync_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    sync_date DATE NOT NULL,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    api_calls_used INTEGER DEFAULT 0,
    sync_duration_ms INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fixtures_date ON fixtures(date);
CREATE INDEX IF NOT EXISTS idx_fixtures_league_season ON fixtures(league_id, season_year);
CREATE INDEX IF NOT EXISTS idx_fixtures_teams ON fixtures(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status_short);
CREATE INDEX IF NOT EXISTS idx_league_standings_league_season ON league_standings(league_id, season_year);
CREATE INDEX IF NOT EXISTS idx_team_statistics_team_league_season ON team_statistics(team_id, league_id, season_year);
CREATE INDEX IF NOT EXISTS idx_player_statistics_player_season ON player_statistics(player_id, season_year);
CREATE INDEX IF NOT EXISTS idx_odds_fixture ON odds(fixture_id);
CREATE INDEX IF NOT EXISTS idx_predictions_fixture ON predictions(fixture_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_table_date ON data_sync_logs(table_name, sync_date);
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_date ON data_sync_logs(sync_date);
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_created_at ON data_sync_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_squads_updated_at BEFORE UPDATE ON team_squads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON fixtures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_league_standings_updated_at BEFORE UPDATE ON league_standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_statistics_updated_at BEFORE UPDATE ON team_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_statistics_updated_at BEFORE UPDATE ON player_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_odds_updated_at BEFORE UPDATE ON odds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prediction_comparison_updated_at BEFORE UPDATE ON prediction_comparison FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_coaches_updated_at BEFORE UPDATE ON team_coaches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
