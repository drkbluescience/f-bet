-- RPC Functions for Supabase
-- These functions need to be created in Supabase SQL Editor

-- Function to execute raw SQL (for table creation)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN 'SQL executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Function to get table information
CREATE OR REPLACE FUNCTION get_table_info()
RETURNS TABLE(
  table_name text,
  column_name text,
  data_type text,
  is_nullable text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text
  FROM information_schema.tables t
  JOIN information_schema.columns c ON t.table_name = c.table_name
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name, c.ordinal_position;
END;
$$;

-- Function to get live fixtures
CREATE OR REPLACE FUNCTION get_live_fixtures()
RETURNS TABLE(
  fixture_id integer,
  home_team text,
  away_team text,
  home_goals integer,
  away_goals integer,
  status text,
  elapsed integer,
  league_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as fixture_id,
    ht.name as home_team,
    at.name as away_team,
    f.home_goals,
    f.away_goals,
    f.status_short as status,
    f.status_elapsed as elapsed,
    l.name as league_name
  FROM fixtures f
  JOIN teams ht ON f.home_team_id = ht.id
  JOIN teams at ON f.away_team_id = at.id
  JOIN leagues l ON f.league_id = l.id
  WHERE f.status_short IN ('1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT')
  ORDER BY f.date DESC;
END;
$$;

-- Function to get today's fixtures
CREATE OR REPLACE FUNCTION get_today_fixtures()
RETURNS TABLE(
  fixture_id integer,
  home_team text,
  away_team text,
  home_goals integer,
  away_goals integer,
  status text,
  fixture_date timestamp with time zone,
  league_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as fixture_id,
    ht.name as home_team,
    at.name as away_team,
    f.home_goals,
    f.away_goals,
    f.status_short as status,
    f.date as fixture_date,
    l.name as league_name
  FROM fixtures f
  JOIN teams ht ON f.home_team_id = ht.id
  JOIN teams at ON f.away_team_id = at.id
  JOIN leagues l ON f.league_id = l.id
  WHERE DATE(f.date) = CURRENT_DATE
  ORDER BY f.date;
END;
$$;

-- Function to get high confidence predictions
CREATE OR REPLACE FUNCTION get_high_confidence_predictions(
  min_confidence integer DEFAULT 70,
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  fixture_id integer,
  home_team text,
  away_team text,
  confidence integer,
  advice text,
  fixture_date timestamp with time zone,
  league_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as fixture_id,
    ht.name as home_team,
    at.name as away_team,
    GREATEST(p.percent_home, p.percent_draw, p.percent_away) as confidence,
    p.advice,
    f.date as fixture_date,
    l.name as league_name
  FROM fixtures f
  JOIN teams ht ON f.home_team_id = ht.id
  JOIN teams at ON f.away_team_id = at.id
  JOIN leagues l ON f.league_id = l.id
  JOIN predictions p ON f.id = p.fixture_id
  WHERE GREATEST(p.percent_home, p.percent_draw, p.percent_away) >= min_confidence
  AND f.date >= CURRENT_DATE
  ORDER BY confidence DESC, f.date
  LIMIT limit_count;
END;
$$;

-- Function to get team statistics
CREATE OR REPLACE FUNCTION get_team_stats(
  team_id_param integer,
  league_id_param integer DEFAULT NULL,
  season_year_param integer DEFAULT NULL
)
RETURNS TABLE(
  team_name text,
  league_name text,
  season_year integer,
  played integer,
  wins integer,
  draws integer,
  losses integer,
  goals_for integer,
  goals_against integer,
  goal_difference integer,
  points integer,
  form text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.name as team_name,
    l.name as league_name,
    ts.season_year,
    ts.fixtures_played_total as played,
    ts.fixtures_wins_total as wins,
    ts.fixtures_draws_total as draws,
    ts.fixtures_loses_total as losses,
    ts.goals_for_total_total as goals_for,
    ts.goals_against_total_total as goals_against,
    (ts.goals_for_total_total - ts.goals_against_total_total) as goal_difference,
    COALESCE(ls.points, 0) as points,
    COALESCE(ls.form, ts.form) as form
  FROM team_statistics ts
  JOIN teams t ON ts.team_id = t.id
  JOIN leagues l ON ts.league_id = l.id
  LEFT JOIN league_standings ls ON ts.team_id = ls.team_id 
    AND ts.league_id = ls.league_id 
    AND ts.season_year = ls.season_year
  WHERE ts.team_id = team_id_param
  AND (league_id_param IS NULL OR ts.league_id = league_id_param)
  AND (season_year_param IS NULL OR ts.season_year = season_year_param)
  ORDER BY ts.season_year DESC, l.name;
END;
$$;

-- Function to search fixtures
CREATE OR REPLACE FUNCTION search_fixtures(
  search_term text DEFAULT NULL,
  league_id_param integer DEFAULT NULL,
  team_id_param integer DEFAULT NULL,
  date_from date DEFAULT NULL,
  date_to date DEFAULT NULL,
  status_param text DEFAULT NULL,
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
  fixture_id integer,
  home_team text,
  away_team text,
  home_goals integer,
  away_goals integer,
  status text,
  fixture_date timestamp with time zone,
  league_name text,
  venue_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as fixture_id,
    ht.name as home_team,
    at.name as away_team,
    f.home_goals,
    f.away_goals,
    f.status_short as status,
    f.date as fixture_date,
    l.name as league_name,
    v.name as venue_name
  FROM fixtures f
  JOIN teams ht ON f.home_team_id = ht.id
  JOIN teams at ON f.away_team_id = at.id
  JOIN leagues l ON f.league_id = l.id
  LEFT JOIN venues v ON f.venue_id = v.id
  WHERE (search_term IS NULL OR 
         ht.name ILIKE '%' || search_term || '%' OR 
         at.name ILIKE '%' || search_term || '%' OR
         l.name ILIKE '%' || search_term || '%')
  AND (league_id_param IS NULL OR f.league_id = league_id_param)
  AND (team_id_param IS NULL OR f.home_team_id = team_id_param OR f.away_team_id = team_id_param)
  AND (date_from IS NULL OR DATE(f.date) >= date_from)
  AND (date_to IS NULL OR DATE(f.date) <= date_to)
  AND (status_param IS NULL OR f.status_short = status_param)
  ORDER BY f.date DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_live_fixtures() TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_fixtures() TO authenticated;
GRANT EXECUTE ON FUNCTION get_high_confidence_predictions(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_stats(integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION search_fixtures(text, integer, integer, date, date, text, integer) TO authenticated;
