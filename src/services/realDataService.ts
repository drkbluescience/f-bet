import { supabase } from './supabaseClient';

/**
 * Gerçek Supabase verilerini çeken servis
 * Mock data yerine gerçek veritabanından veri çeker
 */
export class RealDataService {
  
  /**
   * Ülkeleri çek
   */
  static async getCountries() {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Countries fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Countries service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Ligleri çek
   */
  static async getLeagues() {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select(`
          *,
          countries!leagues_country_id_fkey(
            id,
            name,
            code,
            flag
          )
        `)
        .order('name', { ascending: true });

      if (error) {
        console.error('Leagues fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Leagues service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Takımları çek
   */
  static async getTeams(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          venues!teams_venue_id_fkey(
            id,
            name,
            city,
            country,
            capacity
          )
        `)
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Teams fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Teams service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Oyuncuları çek
   */
  static async getPlayers(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Players fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Players service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Maçları çek
   */
  static async getFixtures(limit = 50) {
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
          leagues!fixtures_league_id_fkey(
            id,
            name,
            logo
          ),
          venues!fixtures_venue_id_fkey(
            id,
            name,
            city
          )
        `)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Fixtures fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Fixtures service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Lig sıralamasını çek
   */
  static async getLeagueStandings(leagueId?: number, seasonYear?: number) {
    try {
      let query = supabase
        .from('league_standings')
        .select(`
          *,
          teams!league_standings_team_id_fkey(
            id,
            name,
            logo
          ),
          leagues!league_standings_league_id_fkey(
            id,
            name,
            logo
          )
        `)
        .order('rank', { ascending: true });

      if (leagueId) {
        query = query.eq('league_id', leagueId);
      }

      if (seasonYear) {
        query = query.eq('season_year', seasonYear);
      }

      const { data, error } = await query;

      if (error) {
        console.error('League standings fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('League standings service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Bahis oranlarını çek
   */
  static async getOdds(fixtureId?: number, limit = 50) {
    try {
      let query = supabase
        .from('odds')
        .select(`
          *,
          fixtures!odds_fixture_id_fkey(
            id,
            date,
            home_team:teams!fixtures_home_team_id_fkey(name),
            away_team:teams!fixtures_away_team_id_fkey(name)
          ),
          bookmakers!odds_bookmaker_id_fkey(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fixtureId) {
        query = query.eq('fixture_id', fixtureId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Odds fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Odds service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Tahminleri çek
   */
  static async getPredictions(fixtureId?: number, limit = 50) {
    try {
      let query = supabase
        .from('predictions')
        .select(`
          *,
          fixtures!predictions_fixture_id_fkey(
            id,
            date,
            home_team:teams!fixtures_home_team_id_fkey(name),
            away_team:teams!fixtures_away_team_id_fkey(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fixtureId) {
        query = query.eq('fixture_id', fixtureId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Predictions fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Predictions service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Veri senkronizasyon loglarını çek
   */
  static async getDataSyncLogs(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('data_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Data sync logs fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Data sync logs service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Tablo istatistiklerini çek
   */
  static async getTableStats() {
    try {
      const tables = [
        'countries', 'leagues', 'seasons', 'venues', 'teams', 'players',
        'team_squads', 'fixtures', 'fixture_events', 'league_standings',
        'team_statistics', 'player_statistics', 'bookmakers', 'odds',
        'predictions', 'transfers', 'coaches', 'data_sync_logs'
      ];

      const stats = [];

      for (const tableName of tables) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!error) {
            stats.push({
              table_name: tableName,
              row_count: count || 0,
              status: 'success'
            });
          } else {
            stats.push({
              table_name: tableName,
              row_count: 0,
              status: 'error',
              error: error.message
            });
          }
        } catch (err) {
          stats.push({
            table_name: tableName,
            row_count: 0,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      return { data: stats, error: null };
    } catch (error) {
      console.error('Table stats service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
