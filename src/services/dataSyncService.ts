import { supabase } from './supabaseClient';
import { ApiFootballService, apiFootballClient } from './apiFootballService';
import { Country, League, Team, Fixture } from '@/types';

// Data transformation utilities
class DataTransformer {
  static transformCountry(apiCountry: any): Partial<Country> {
    return {
      country_id: apiCountry.code ? this.hashCode(apiCountry.code) : this.hashCode(apiCountry.name),
      name: apiCountry.name,
      code: apiCountry.code || apiCountry.name.substring(0, 3).toUpperCase(),
      flag_url: apiCountry.flag,
    };
  }

  static transformLeague(apiLeague: any): Partial<League> {
    return {
      league_id: apiLeague.league.id,
      name: apiLeague.league.name,
      country_id: this.hashCode(apiLeague.country.code || apiLeague.country.name),
      season_year: apiLeague.seasons?.[0]?.year || new Date().getFullYear(),
      type: apiLeague.league.type,
      logo_url: apiLeague.league.logo,
    };
  }

  static transformTeam(apiTeam: any): Partial<Team> {
    return {
      team_id: apiTeam.team.id,
      name: apiTeam.team.name,
      country_id: apiTeam.team.country ? this.hashCode(apiTeam.team.country) : undefined,
      founded_year: apiTeam.team.founded,
      venue_id: apiTeam.venue?.id,
      logo_url: apiTeam.team.logo,
    };
  }

  static transformFixture(apiFixture: any): Partial<Fixture> {
    return {
      fixture_id: apiFixture.fixture.id,
      league_id: apiFixture.league.id,
      season_year: apiFixture.league.season,
      date_utc: apiFixture.fixture.date,
      status: apiFixture.fixture.status.short,
      home_team_id: apiFixture.teams.home.id,
      away_team_id: apiFixture.teams.away.id,
      venue_id: apiFixture.fixture.venue?.id,
      referee: apiFixture.fixture.referee,
      home_goals: apiFixture.goals?.home,
      away_goals: apiFixture.goals?.away,
    };
  }

  // Simple hash function for generating IDs from strings
  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Data synchronization service
export class DataSyncService {
  private static isRunning = false;
  private static lastSyncTime: Record<string, number> = {};

  // Sync intervals (in milliseconds)
  private static readonly SYNC_INTERVALS = {
    countries: 24 * 60 * 60 * 1000, // 24 hours
    leagues: 24 * 60 * 60 * 1000,   // 24 hours
    teams: 12 * 60 * 60 * 1000,     // 12 hours
    fixtures: 30 * 60 * 1000,       // 30 minutes
    liveFixtures: 30 * 1000,        // 30 seconds
  };

  static async syncAll(): Promise<{ success: boolean; message: string; details: any }> {
    if (this.isRunning) {
      return { success: false, message: 'Sync already in progress', details: {} };
    }

    this.isRunning = true;
    const results: any = {};

    try {
      console.log('🔄 Starting full data synchronization...');

      // Sync in order of dependency
      results.countries = await this.syncCountries();
      results.leagues = await this.syncLeagues();
      results.teams = await this.syncTeams();
      results.fixtures = await this.syncFixtures();

      console.log('✅ Full data synchronization completed');
      return { 
        success: true, 
        message: 'Full synchronization completed successfully', 
        details: results 
      };
    } catch (error) {
      console.error('❌ Full synchronization failed:', error);
      return { 
        success: false, 
        message: `Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        details: results 
      };
    } finally {
      this.isRunning = false;
    }
  }

  static async syncCountries(): Promise<{ synced: number; errors: number }> {
    console.log('🌍 Syncing countries...');
    let synced = 0;
    let errors = 0;

    try {
      const response = await ApiFootballService.fetchCountries();
      const countries = response.response || [];

      for (const apiCountry of countries) {
        try {
          const country = DataTransformer.transformCountry(apiCountry);
          
          const { error } = await supabase
            .from('countries')
            .upsert(country, { onConflict: 'country_id' });

          if (error) {
            console.error('Error syncing country:', error);
            errors++;
          } else {
            synced++;
          }
        } catch (error) {
          console.error('Error processing country:', error);
          errors++;
        }
      }

      this.lastSyncTime.countries = Date.now();
      console.log(`✅ Countries sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching countries from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncLeagues(country?: string): Promise<{ synced: number; errors: number }> {
    console.log('🏆 Syncing leagues...');
    let synced = 0;
    let errors = 0;

    try {
      const currentYear = new Date().getFullYear();
      const response = await ApiFootballService.fetchLeagues(country, currentYear);
      const leagues = response.response || [];

      for (const apiLeague of leagues) {
        try {
          const league = DataTransformer.transformLeague(apiLeague);
          
          // Ensure season exists
          await supabase
            .from('seasons')
            .upsert({ 
              season_year: league.season_year,
              start_date: `${league.season_year}-08-01`,
              end_date: `${league.season_year! + 1}-07-31`
            }, { onConflict: 'season_year' });

          const { error } = await supabase
            .from('leagues')
            .upsert(league, { onConflict: 'league_id,season_year' });

          if (error) {
            console.error('Error syncing league:', error);
            errors++;
          } else {
            synced++;
          }
        } catch (error) {
          console.error('Error processing league:', error);
          errors++;
        }
      }

      this.lastSyncTime.leagues = Date.now();
      console.log(`✅ Leagues sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching leagues from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncTeams(leagueId?: number): Promise<{ synced: number; errors: number }> {
    console.log('⚽ Syncing teams...');
    let synced = 0;
    let errors = 0;

    try {
      const currentYear = new Date().getFullYear();
      const response = await ApiFootballService.fetchTeams(leagueId, currentYear);
      const teams = response.response || [];

      for (const apiTeam of teams) {
        try {
          const team = DataTransformer.transformTeam(apiTeam);
          
          const { error } = await supabase
            .from('teams')
            .upsert(team, { onConflict: 'team_id' });

          if (error) {
            console.error('Error syncing team:', error);
            errors++;
          } else {
            synced++;
          }
        } catch (error) {
          console.error('Error processing team:', error);
          errors++;
        }
      }

      this.lastSyncTime.teams = Date.now();
      console.log(`✅ Teams sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching teams from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncFixtures(params: {
    league?: number;
    team?: number;
    date?: string;
    from?: string;
    to?: string;
  } = {}): Promise<{ synced: number; errors: number }> {
    console.log('📅 Syncing fixtures...');
    let synced = 0;
    let errors = 0;

    try {
      const response = await ApiFootballService.fetchFixtures(params);
      const fixtures = response.response || [];

      for (const apiFixture of fixtures) {
        try {
          const fixture = DataTransformer.transformFixture(apiFixture);
          
          const { error } = await supabase
            .from('fixtures')
            .upsert(fixture, { onConflict: 'fixture_id' });

          if (error) {
            console.error('Error syncing fixture:', error);
            errors++;
          } else {
            synced++;
          }
        } catch (error) {
          console.error('Error processing fixture:', error);
          errors++;
        }
      }

      this.lastSyncTime.fixtures = Date.now();
      console.log(`✅ Fixtures sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching fixtures from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncLiveFixtures(): Promise<{ synced: number; errors: number }> {
    console.log('🔴 Syncing live fixtures...');
    let synced = 0;
    let errors = 0;

    try {
      const response = await ApiFootballService.fetchLiveFixtures();
      const fixtures = response.response || [];

      for (const apiFixture of fixtures) {
        try {
          const fixture = DataTransformer.transformFixture(apiFixture);
          
          const { error } = await supabase
            .from('fixtures')
            .upsert(fixture, { onConflict: 'fixture_id' });

          if (error) {
            console.error('Error syncing live fixture:', error);
            errors++;
          } else {
            synced++;
          }
        } catch (error) {
          console.error('Error processing live fixture:', error);
          errors++;
        }
      }

      this.lastSyncTime.liveFixtures = Date.now();
      console.log(`✅ Live fixtures sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching live fixtures from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncTodayFixtures(): Promise<{ synced: number; errors: number }> {
    const today = new Date().toISOString().split('T')[0];
    return this.syncFixtures({ date: today });
  }

  // Check if sync is needed based on intervals
  static shouldSync(type: keyof typeof DataSyncService.SYNC_INTERVALS): boolean {
    const lastSync = this.lastSyncTime[type] || 0;
    const interval = this.SYNC_INTERVALS[type];
    return Date.now() - lastSync > interval;
  }

  // Get sync status
  static getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTimes: this.lastSyncTime,
      intervals: this.SYNC_INTERVALS,
    };
  }
}

export default DataSyncService;
