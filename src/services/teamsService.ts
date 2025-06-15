import { supabase } from './supabaseClient';
import { Team, TeamSeasonStats, Player, FilterOptions, PaginatedResponse } from '@/types';

export class TeamsService {
  /**
   * Get teams with optional filtering and pagination
   */
  static async getTeams(
    options: FilterOptions & { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Team>> {
    const { page = 1, limit = 20, ...filters } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('teams')
      .select(`
        *,
        venue:venues(
          id,
          name,
          city,
          capacity
        )
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    // Apply filters
    if (filters.league_id) {
      // Get teams that have played in this league
      const { data: teamIds } = await supabase
        .from('team_statistics')
        .select('team_id')
        .eq('league_id', filters.league_id);

      if (teamIds && teamIds.length > 0) {
        const ids = teamIds.map(t => t.team_id);
        query = query.in('id', ids);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get a single team by ID with detailed information
   */
  static async getTeamById(teamId: number): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        venue:venues(
          id,
          name,
          city,
          capacity
        )
      `)
      .eq('id', teamId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch team: ${error.message}`);
    }

    return data;
  }

  /**
   * Get team season statistics
   */
  static async getTeamSeasonStats(
    teamId: number,
    options: { league_id?: number; season_year?: number } = {}
  ): Promise<TeamSeasonStats[]> {
    let query = supabase
      .from('team_season_stats')
      .select(`
        *,
        team:teams(
          team_id,
          name,
          logo_url
        ),
        league:leagues(
          league_id,
          name,
          logo_url
        )
      `)
      .eq('team_id', teamId);

    if (options.league_id) {
      query = query.eq('league_id', options.league_id);
    }
    if (options.season_year) {
      query = query.eq('season_year', options.season_year);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch team season stats: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get team players
   */
  static async getTeamPlayers(teamId: number): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        team:teams(
          team_id,
          name,
          logo_url
        )
      `)
      .eq('team_id', teamId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch team players: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get team's recent fixtures
   */
  static async getTeamRecentFixtures(
    teamId: number,
    limit: number = 10
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('fixtures')
      .select(`
        *,
        home_team:teams!fixtures_home_team_id_fkey(
          team_id,
          name,
          logo_url
        ),
        away_team:teams!fixtures_away_team_id_fkey(
          team_id,
          name,
          logo_url
        ),
        league:leagues(
          league_id,
          name,
          logo_url
        )
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .not('status', 'is', null)
      .in('status', ['FT', 'AET', 'PEN'])
      .order('date_utc', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch team recent fixtures: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get team's upcoming fixtures
   */
  static async getTeamUpcomingFixtures(
    teamId: number,
    limit: number = 10
  ): Promise<any[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('fixtures')
      .select(`
        *,
        home_team:teams!fixtures_home_team_id_fkey(
          team_id,
          name,
          logo_url
        ),
        away_team:teams!fixtures_away_team_id_fkey(
          team_id,
          name,
          logo_url
        ),
        league:leagues(
          league_id,
          name,
          logo_url
        )
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .gte('date_utc', now)
      .order('date_utc', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch team upcoming fixtures: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get head-to-head record between two teams
   */
  static async getHeadToHead(team1Id: number, team2Id: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('fixtures')
      .select(`
        *,
        home_team:teams!fixtures_home_team_id_fkey(
          team_id,
          name,
          logo_url
        ),
        away_team:teams!fixtures_away_team_id_fkey(
          team_id,
          name,
          logo_url
        ),
        league:leagues(
          league_id,
          name,
          logo_url
        )
      `)
      .or(
        `and(home_team_id.eq.${team1Id},away_team_id.eq.${team2Id}),and(home_team_id.eq.${team2Id},away_team_id.eq.${team1Id})`
      )
      .in('status', ['FT', 'AET', 'PEN'])
      .order('date_utc', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch head-to-head record: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search teams by name
   */
  static async searchTeams(searchTerm: string, limit: number = 10): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        country:countries(
          country_id,
          name,
          flag_url
        )
      `)
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search teams: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get teams by league
   */
  static async getTeamsByLeague(
    leagueId: number,
    seasonYear?: number
  ): Promise<Team[]> {
    let query = supabase
      .from('team_season_stats')
      .select(`
        team:teams(
          *,
          country:countries(
            country_id,
            name,
            flag_url
          )
        )
      `)
      .eq('league_id', leagueId);

    if (seasonYear) {
      query = query.eq('season_year', seasonYear);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch teams by league: ${error.message}`);
    }

    return data?.map(item => item.team).filter(Boolean) || [];
  }
}
