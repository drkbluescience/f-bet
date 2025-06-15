import { supabase } from './supabaseClient';
import { Fixture, FixtureTeamStats, FixtureEvent, FilterOptions, PaginatedResponse } from '@/types';

// Mock data for development
const mockFixtures: Fixture[] = [
  {
    fixture_id: 1,
    league_id: 39,
    season_year: 2024,
    date_utc: new Date().toISOString(),
    status: 'LIVE',
    home_team_id: 1,
    away_team_id: 2,
    venue_id: 1,
    referee: 'John Doe',
    home_goals: 1,
    away_goals: 0,
    updated_at: new Date().toISOString(),
    home_team: { team_id: 1, name: 'Arsenal', logo_url: '', created_at: '', updated_at: '' },
    away_team: { team_id: 2, name: 'Chelsea', logo_url: '', created_at: '', updated_at: '' },
    league: { league_id: 39, name: 'Premier League', country_id: 1, season_year: 2024, created_at: '', updated_at: '' }
  },
  {
    fixture_id: 2,
    league_id: 39,
    season_year: 2024,
    date_utc: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'NS',
    home_team_id: 3,
    away_team_id: 4,
    venue_id: 2,
    referee: 'Jane Smith',
    home_goals: null,
    away_goals: null,
    updated_at: new Date().toISOString(),
    home_team: { team_id: 3, name: 'Manchester United', logo_url: '', created_at: '', updated_at: '' },
    away_team: { team_id: 4, name: 'Liverpool', logo_url: '', created_at: '', updated_at: '' },
    league: { league_id: 39, name: 'Premier League', country_id: 1, season_year: 2024, created_at: '', updated_at: '' }
  },
  {
    fixture_id: 3,
    league_id: 140,
    season_year: 2024,
    date_utc: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    status: 'NS',
    home_team_id: 5,
    away_team_id: 6,
    venue_id: 3,
    referee: 'Mike Johnson',
    home_goals: null,
    away_goals: null,
    updated_at: new Date().toISOString(),
    home_team: { team_id: 5, name: 'Real Madrid', logo_url: '', created_at: '', updated_at: '' },
    away_team: { team_id: 6, name: 'Barcelona', logo_url: '', created_at: '', updated_at: '' },
    league: { league_id: 140, name: 'La Liga', country_id: 2, season_year: 2024, created_at: '', updated_at: '' }
  }
];

export class FixturesService {
  /**
   * Get fixtures with optional filtering and pagination
   */
  static async getFixtures(
    options: FilterOptions & { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Fixture>> {
    const { page = 1, limit = 20, ...filters } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('fixtures')
      .select(`
        *,
        home_team:teams!fixtures_home_team_id_fkey(
          id,
          name,
          logo
        ),
        away_team:teams!fixtures_away_team_id_fkey(
          id,
          name,
          logo
        ),
        league:leagues(
          id,
          name,
          logo
        ),
        venue:venues(
          id,
          name,
          city
        )
      `)
      .range(offset, offset + limit - 1)
      .order('date', { ascending: false });

    // Apply filters
    if (filters.league_id) {
      query = query.eq('league_id', filters.league_id);
    }
    if (filters.season_year) {
      query = query.eq('season_year', filters.season_year);
    }
    if (filters.team_id) {
      query = query.or(`home_team_id.eq.${filters.team_id},away_team_id.eq.${filters.team_id}`);
    }
    if (filters.status) {
      query = query.eq('status_short', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('date', filters.date_to);
    }

    const { data, error, count } = await query;

    if (error) {
      console.warn('Supabase error in getFixtures:', error.message);
      return {
        data: [],
        count: 0,
        page,
        limit,
        total_pages: 0,
      };
    }

    // Transform the data to match expected interface
    const transformedData = (data || []).map(item => ({
      fixture_id: item.id,
      league_id: item.league_id,
      season_year: item.season_year,
      date_utc: item.date,
      status: item.status_short || item.status_long,
      home_team_id: item.home_team_id,
      away_team_id: item.away_team_id,
      venue_id: item.venue_id,
      referee: item.referee,
      home_goals: item.home_goals,
      away_goals: item.away_goals,
      updated_at: item.updated_at,
      home_team: item.home_team ? {
        team_id: item.home_team.id,
        name: item.home_team.name,
        logo_url: item.home_team.logo,
        created_at: '',
        updated_at: ''
      } : undefined,
      away_team: item.away_team ? {
        team_id: item.away_team.id,
        name: item.away_team.name,
        logo_url: item.away_team.logo,
        created_at: '',
        updated_at: ''
      } : undefined,
      league: item.league ? {
        league_id: item.league.id,
        name: item.league.name,
        country_id: 0,
        season_year: item.season_year,
        logo_url: item.league.logo,
        created_at: '',
        updated_at: ''
      } : undefined,
      venue: item.venue ? {
        venue_id: item.venue.id,
        name: item.venue.name,
        city: item.venue.city,
        updated_at: ''
      } : undefined
    }));

    return {
      data: transformedData,
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get a single fixture by ID with detailed information
   */
  static async getFixtureById(fixtureId: number): Promise<Fixture> {
    try {
      const { data, error } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(
            id,
            name,
            logo,
            founded,
            country
          ),
          away_team:teams!fixtures_away_team_id_fkey(
            id,
            name,
            logo,
            founded,
            country
          ),
          league:leagues(
            id,
            name,
            logo,
            type
          ),
          venue:venues(
            id,
            name,
            city,
            country,
            capacity,
            surface
          )
        `)
        .eq('id', fixtureId)
        .single();

      if (error) {
        console.warn('Supabase error in getFixtureById:', error.message);
        // Return mock data if no real data found
        const mockFixture = mockFixtures.find(f => f.fixture_id === fixtureId);
        if (mockFixture) {
          return mockFixture;
        }
        throw new Error(`Failed to fetch fixture: ${error.message}`);
      }

      // Transform the data to match expected interface
      return {
        fixture_id: data.id,
        league_id: data.league_id,
        season_year: data.season_year,
        date_utc: data.date,
        status: data.status_short || data.status_long,
        home_team_id: data.home_team_id,
        away_team_id: data.away_team_id,
        venue_id: data.venue_id,
        referee: data.referee,
        home_goals: data.home_goals,
        away_goals: data.away_goals,
        updated_at: data.updated_at,
        home_team: data.home_team ? {
          team_id: data.home_team.id,
          name: data.home_team.name,
          logo_url: data.home_team.logo,
          created_at: '',
          updated_at: ''
        } : undefined,
        away_team: data.away_team ? {
          team_id: data.away_team.id,
          name: data.away_team.name,
          logo_url: data.away_team.logo,
          created_at: '',
          updated_at: ''
        } : undefined,
        league: data.league ? {
          league_id: data.league.id,
          name: data.league.name,
          country_id: 0,
          season_year: data.season_year,
          logo_url: data.league.logo,
          created_at: '',
          updated_at: ''
        } : undefined,
        venue: data.venue ? {
          venue_id: data.venue.id,
          name: data.venue.name,
          city: data.venue.city,
          country: data.venue.country,
          capacity: data.venue.capacity,
          surface: data.venue.surface,
          updated_at: ''
        } : undefined
      };
    } catch (error) {
      console.warn('Service error in getFixtureById, using mock data:', error);
      const mockFixture = mockFixtures.find(f => f.fixture_id === fixtureId);
      if (mockFixture) {
        return mockFixture;
      }
      throw new Error(`Failed to fetch fixture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get team statistics for a specific fixture
   */
  static async getFixtureTeamStats(fixtureId: number): Promise<FixtureTeamStats[]> {
    const { data, error } = await supabase
      .from('fixture_team_stats')
      .select(`
        *,
        team:teams(
          team_id,
          name,
          logo_url
        )
      `)
      .eq('fixture_id', fixtureId);

    if (error) {
      throw new Error(`Failed to fetch fixture team stats: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get events for a specific fixture
   */
  static async getFixtureEvents(fixtureId: number): Promise<FixtureEvent[]> {
    const { data, error } = await supabase
      .from('fixture_events')
      .select(`
        *,
        team:teams(
          team_id,
          name,
          logo_url
        ),
        player:players(
          player_id,
          name,
          position
        )
      `)
      .eq('fixture_id', fixtureId)
      .order('minute', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch fixture events: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get live fixtures
   */
  static async getLiveFixtures(): Promise<Fixture[]> {
    try {
      const { data, error } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(
            id,
            name,
            logo
          ),
          away_team:teams!fixtures_away_team_id_fkey(
            id,
            name,
            logo
          ),
          league:leagues(
            id,
            name,
            logo
          )
        `)
        .in('status_short', ['LIVE', 'HT', '1H', '2H'])
        .order('date', { ascending: true });

      if (error) {
        console.warn('Supabase error, using mock data:', error.message);
        return mockFixtures.filter(f => f.status === 'LIVE');
      }

      // Transform the data to match expected interface
      return (data || []).map(item => ({
        fixture_id: item.id,
        league_id: item.league_id,
        season_year: item.season_year,
        date_utc: item.date,
        status: item.status_short || item.status_long,
        home_team_id: item.home_team_id,
        away_team_id: item.away_team_id,
        venue_id: item.venue_id,
        referee: item.referee,
        home_goals: item.home_goals,
        away_goals: item.away_goals,
        updated_at: item.updated_at,
        home_team: item.home_team ? {
          team_id: item.home_team.id,
          name: item.home_team.name,
          logo_url: item.home_team.logo,
          created_at: '',
          updated_at: ''
        } : undefined,
        away_team: item.away_team ? {
          team_id: item.away_team.id,
          name: item.away_team.name,
          logo_url: item.away_team.logo,
          created_at: '',
          updated_at: ''
        } : undefined,
        league: item.league ? {
          league_id: item.league.id,
          name: item.league.name,
          country_id: 0,
          season_year: item.season_year,
          logo_url: item.league.logo,
          created_at: '',
          updated_at: ''
        } : undefined
      }));
    } catch (error) {
      console.warn('Service error, using mock data:', error);
      return mockFixtures.filter(f => f.status === 'LIVE');
    }
  }

  /**
   * Get today's fixtures
   */
  static async getTodayFixtures(): Promise<Fixture[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data, error } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(
            id,
            name,
            logo
          ),
          away_team:teams!fixtures_away_team_id_fkey(
            id,
            name,
            logo
          ),
          league:leagues(
            id,
            name,
            logo
          )
        `)
        .gte('date', startOfDay.toISOString())
        .lt('date', endOfDay.toISOString())
        .order('date', { ascending: true });

      if (error) {
        console.warn('Supabase error, using mock data:', error.message);
        return mockFixtures;
      }

      // Transform the data to match expected interface
      return (data || []).map(item => ({
        fixture_id: item.id,
        league_id: item.league_id,
        season_year: item.season_year,
        date_utc: item.date,
        status: item.status_short || item.status_long,
        home_team_id: item.home_team_id,
        away_team_id: item.away_team_id,
        venue_id: item.venue_id,
        referee: item.referee,
        home_goals: item.home_goals,
        away_goals: item.away_goals,
        updated_at: item.updated_at,
        home_team: item.home_team ? {
          team_id: item.home_team.id,
          name: item.home_team.name,
          logo_url: item.home_team.logo,
          created_at: '',
          updated_at: ''
        } : undefined,
        away_team: item.away_team ? {
          team_id: item.away_team.id,
          name: item.away_team.name,
          logo_url: item.away_team.logo,
          created_at: '',
          updated_at: ''
        } : undefined,
        league: item.league ? {
          league_id: item.league.id,
          name: item.league.name,
          country_id: 0,
          season_year: item.season_year,
          logo_url: item.league.logo,
          created_at: '',
          updated_at: ''
        } : undefined
      }));
    } catch (error) {
      console.warn('Service error, using mock data:', error);
      return mockFixtures;
    }
  }

  /**
   * Subscribe to real-time fixture updates
   */
  static subscribeToFixtureUpdates(
    fixtureId: number,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`fixture-${fixtureId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fixtures',
          filter: `id=eq.${fixtureId}`,
        },
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to real-time fixture events
   */
  static subscribeToFixtureEvents(
    fixtureId: number,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`fixture-events-${fixtureId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fixture_events',
          filter: `fixture_id=eq.${fixtureId}`,
        },
        callback
      )
      .subscribe();
  }
}
