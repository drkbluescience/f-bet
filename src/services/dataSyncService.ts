import { supabase } from './supabaseClient';
import { ApiFootballService, apiFootballClient } from './apiFootballService';
import { Country, League, Team, Fixture } from '@/types';

// Data transformation utilities
class DataTransformer {
  static transformCountry(apiCountry: any): any {
    return {
      name: apiCountry.name,
      code: apiCountry.code || apiCountry.name.substring(0, 3).toUpperCase(),
      flag: apiCountry.flag,
    };
  }

  static transformLeague(apiLeague: any): any {
    return {
      id: apiLeague.league.id,
      name: apiLeague.league.name,
      type: apiLeague.league.type,
      logo: apiLeague.league.logo,
      country_id: null, // Will be set after countries are synced
    };
  }

  static transformTeam(apiTeam: any): any {
    return {
      id: apiTeam.team.id,
      name: apiTeam.team.name,
      code: apiTeam.team.code,
      country: apiTeam.team.country,
      founded: apiTeam.team.founded,
      national: apiTeam.team.national || false,
      logo: apiTeam.team.logo,
      venue_id: apiTeam.venue?.id,
    };
  }

  static transformFixture(apiFixture: any): any {
    return {
      id: apiFixture.fixture.id,
      referee: apiFixture.fixture.referee,
      timezone: apiFixture.fixture.timezone,
      date: apiFixture.fixture.date,
      timestamp: apiFixture.fixture.timestamp,
      venue_id: apiFixture.fixture.venue?.id,
      status_long: apiFixture.fixture.status.long,
      status_short: apiFixture.fixture.status.short,
      status_elapsed: apiFixture.fixture.status.elapsed,
      league_id: apiFixture.league.id,
      season_year: apiFixture.league.season,
      round: apiFixture.league.round,
      home_team_id: apiFixture.teams.home.id,
      away_team_id: apiFixture.teams.away.id,
      home_goals: apiFixture.goals?.home,
      away_goals: apiFixture.goals?.away,
      home_goals_halftime: apiFixture.score?.halftime?.home,
      away_goals_halftime: apiFixture.score?.halftime?.away,
      home_goals_extratime: apiFixture.score?.extratime?.home,
      away_goals_extratime: apiFixture.score?.extratime?.away,
      home_goals_penalty: apiFixture.score?.penalty?.home,
      away_goals_penalty: apiFixture.score?.penalty?.away,
    };
  }

  static transformPlayer(apiPlayer: any): any {
    return {
      id: apiPlayer.player.id,
      name: apiPlayer.player.name,
      firstname: apiPlayer.player.firstname,
      lastname: apiPlayer.player.lastname,
      age: apiPlayer.player.age,
      birth_date: apiPlayer.player.birth?.date,
      birth_place: apiPlayer.player.birth?.place,
      birth_country: apiPlayer.player.birth?.country,
      nationality: apiPlayer.player.nationality,
      height: apiPlayer.player.height,
      weight: apiPlayer.player.weight,
      injured: apiPlayer.player.injured || false,
      photo: apiPlayer.player.photo,
    };
  }

  static transformPlayerStatistics(apiPlayer: any, teamId: number, leagueId: number, season: number): any {
    const stats = apiPlayer.statistics?.[0]; // Get first statistics entry
    if (!stats) return null;

    return {
      player_id: apiPlayer.player.id,
      team_id: teamId,
      league_id: leagueId,
      season_year: season,
      position: stats.games?.position,
      rating: stats.games?.rating,
      captain: stats.games?.captain || false,
      appearances: stats.games?.appearences || 0,
      lineups: stats.games?.lineups || 0,
      minutes: stats.games?.minutes || 0,
      substitutes_in: stats.substitutes?.in || 0,
      substitutes_out: stats.substitutes?.out || 0,
      substitutes_bench: stats.substitutes?.bench || 0,
      goals_total: stats.goals?.total || 0,
      goals_conceded: stats.goals?.conceded || 0,
      assists: stats.goals?.assists || 0,
      saves: stats.goals?.saves || 0,
      passes_total: stats.passes?.total || 0,
      passes_key: stats.passes?.key || 0,
      passes_accuracy: stats.passes?.accuracy || 0,
      tackles_total: stats.tackles?.total || 0,
      tackles_blocks: stats.tackles?.blocks || 0,
      tackles_interceptions: stats.tackles?.interceptions || 0,
      duels_total: stats.duels?.total || 0,
      duels_won: stats.duels?.won || 0,
      dribbles_attempts: stats.dribbles?.attempts || 0,
      dribbles_success: stats.dribbles?.success || 0,
      dribbles_past: stats.dribbles?.past || 0,
      fouls_drawn: stats.fouls?.drawn || 0,
      fouls_committed: stats.fouls?.committed || 0,
      cards_yellow: stats.cards?.yellow || 0,
      cards_yellowred: stats.cards?.yellowred || 0,
      cards_red: stats.cards?.red || 0,
      penalty_won: stats.penalty?.won || 0,
      penalty_committed: stats.penalty?.commited || 0,
      penalty_scored: stats.penalty?.scored || 0,
      penalty_missed: stats.penalty?.missed || 0,
      penalty_saved: stats.penalty?.saved || 0,
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
    players: 7 * 24 * 60 * 60 * 1000, // 7 days (weekly)
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
            .upsert(country, { onConflict: 'name' });

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
            .upsert(league, { onConflict: 'id' });

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
            .upsert(team, { onConflict: 'id' });

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
            .upsert(fixture, { onConflict: 'id' });

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

  static async syncStandings(leagueId: number, season: number): Promise<{ synced: number; errors: number }> {
    console.log(`📊 Syncing standings for league ${leagueId}, season ${season}...`);
    let synced = 0;
    let errors = 0;

    try {
      const response = await ApiFootballService.fetchStandings(leagueId, season);
      const standings = response.response || [];

      for (const standingGroup of standings) {
        const league = standingGroup.league;
        const standingsData = league.standings[0] || []; // Get main standings

        for (const teamStanding of standingsData) {
          try {
            const standing = {
              league_id: league.id,
              season_year: season,
              team_id: teamStanding.team.id,
              rank: teamStanding.rank,
              points: teamStanding.points,
              goalsDiff: teamStanding.goalsDiff,
              group_name: teamStanding.group || null,
              form: teamStanding.form,
              status: teamStanding.status,
              description: teamStanding.description,
              played: teamStanding.all.played,
              win: teamStanding.all.win,
              draw: teamStanding.all.draw,
              lose: teamStanding.all.lose,
              goals_for: teamStanding.all.goals.for,
              goals_against: teamStanding.all.goals.against,
            };

            const { error } = await supabase
              .from('league_standings')
              .upsert(standing, { onConflict: 'league_id,season_year,team_id' });

            if (error) {
              console.error('Error syncing standing:', error);
              errors++;
            } else {
              synced++;
            }
          } catch (error) {
            console.error('Error processing standing:', error);
            errors++;
          }
        }
      }

      console.log(`✅ Standings sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching standings from API:', error);
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
            .upsert(fixture, { onConflict: 'id' });

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

  static async syncPlayers(params: {
    team?: number;
    league?: number;
    season?: number;
    search?: string;
  } = {}): Promise<{ synced: number; errors: number }> {
    console.log('👤 Syncing players...');
    let synced = 0;
    let errors = 0;

    try {
      const currentSeason = params.season || new Date().getFullYear();
      let page = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        console.log(`📄 Fetching players page ${page}...`);

        const response = await ApiFootballService.fetchPlayers({
          ...params,
          season: currentSeason,
          page
        });

        const players = response.response || [];

        if (players.length === 0) {
          hasMorePages = false;
          break;
        }

        for (const apiPlayer of players) {
          try {
            // Sync player basic info
            const player = DataTransformer.transformPlayer(apiPlayer);

            const { error: playerError } = await supabase
              .from('players')
              .upsert(player, { onConflict: 'id' });

            if (playerError) {
              console.error('Error syncing player:', playerError);
              errors++;
              continue;
            }

            // Sync player statistics if available
            if (apiPlayer.statistics && apiPlayer.statistics.length > 0) {
              for (const statEntry of apiPlayer.statistics) {
                const teamId = statEntry.team?.id;
                const leagueId = statEntry.league?.id;

                if (teamId && leagueId) {
                  const playerStats = DataTransformer.transformPlayerStatistics(
                    apiPlayer,
                    teamId,
                    leagueId,
                    currentSeason
                  );

                  if (playerStats) {
                    const { error: statsError } = await supabase
                      .from('player_statistics')
                      .upsert(playerStats, {
                        onConflict: 'player_id,team_id,league_id,season_year'
                      });

                    if (statsError) {
                      console.error('Error syncing player statistics:', statsError);
                      errors++;
                    }
                  }
                }
              }
            }

            synced++;
          } catch (error) {
            console.error('Error processing player:', error);
            errors++;
          }
        }

        // Check if we should continue to next page
        if (players.length < 20) { // API returns 20 per page
          hasMorePages = false;
        } else {
          page++;
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.lastSyncTime.players = Date.now();
      console.log(`✅ Players sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching players from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncPlayersByTeam(teamId: number, season?: number): Promise<{ synced: number; errors: number }> {
    console.log(`👥 Syncing players for team ${teamId}...`);
    return this.syncPlayers({ team: teamId, season });
  }

  static async syncPlayersByLeague(leagueId: number, season?: number): Promise<{ synced: number; errors: number }> {
    console.log(`🏆 Syncing players for league ${leagueId}...`);
    return this.syncPlayers({ league: leagueId, season });
  }

  static async syncMajorLeaguePlayers(season?: number): Promise<{ synced: number; errors: number }> {
    console.log('⭐ Syncing players for major leagues...');

    // Major leagues: Premier League, La Liga, Süper Lig, Bundesliga, Serie A
    const majorLeagues = [39, 140, 203, 78, 135];
    const currentSeason = season || new Date().getFullYear();

    let totalSynced = 0;
    let totalErrors = 0;

    for (const leagueId of majorLeagues) {
      try {
        console.log(`🔄 Syncing players for league ${leagueId}...`);
        const result = await this.syncPlayersByLeague(leagueId, currentSeason);
        totalSynced += result.synced;
        totalErrors += result.errors;

        // Add delay between leagues to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error syncing players for league ${leagueId}:`, error);
        totalErrors++;
      }
    }

    console.log(`✅ Major leagues players sync completed: ${totalSynced} synced, ${totalErrors} errors`);
    return { synced: totalSynced, errors: totalErrors };
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

  // Additional sync methods for all tables
  static async syncVenues(params: { country?: string; city?: string; search?: string } = {}): Promise<{ synced: number; errors: number }> {
    console.log('🏟️ Syncing venues...');
    let synced = 0;
    let errors = 0;

    try {
      const response = await apiFootballClient.getVenues(params);
      const venues = response.response || [];

      if (!Array.isArray(venues)) {
        console.warn('⚠️ Venues response is not an array:', venues);
        return { synced: 0, errors: 1 };
      }

      for (const apiVenue of venues) {
        try {
          // Validate required fields
          if (!apiVenue || !apiVenue.id) {
            console.warn('⚠️ Invalid venue data:', apiVenue);
            errors++;
            continue;
          }

          const venue = {
            id: apiVenue.id,
            name: apiVenue.name || 'Unknown Venue',
            address: apiVenue.address || null,
            city: apiVenue.city || null,
            country: apiVenue.country || null,
            capacity: apiVenue.capacity ? parseInt(apiVenue.capacity) : null,
            surface: apiVenue.surface || null,
            image: apiVenue.image || null,
          };

          const { error } = await supabase
            .from('venues')
            .upsert(venue, { onConflict: 'id' });

          if (error) {
            console.error('Error syncing venue:', error);
            errors++;
          } else {
            synced++;
          }
        } catch (error) {
          console.error('Error processing venue:', error);
          errors++;
        }
      }

      console.log(`✅ Venues sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching venues from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncOdds(params: { fixture?: number; league?: number; season?: number; bet?: number } = {}): Promise<{ synced: number; errors: number }> {
    console.log('💰 Syncing odds...');
    let synced = 0;
    let errors = 0;

    try {
      const response = await apiFootballClient.getOdds(params);
      const oddsData = response.response || [];

      for (const oddsEntry of oddsData) {
        try {
          // Sync bookmakers first
          for (const bookmaker of oddsEntry.bookmakers || []) {
            const bookmakerId = bookmaker.id;
            const bookmakerData = {
              bookmaker_id: bookmakerId,
              name: bookmaker.name,
              country: null, // API doesn't provide country in odds endpoint
            };

            await supabase
              .from('bookmakers')
              .upsert(bookmakerData, { onConflict: 'bookmaker_id' });

            // Sync odds for each bet
            for (const bet of bookmaker.bets || []) {
              for (const value of bet.values || []) {
                const odds = {
                  fixture_id: oddsEntry.fixture.id,
                  bookmaker_id: bookmakerId,
                  bet_id: bet.id,
                  bet_name: bet.name,
                  value: value.value,
                  odd: parseFloat(value.odd),
                  recorded_at: new Date().toISOString(),
                };

                const { error } = await supabase
                  .from('odds')
                  .upsert(odds, { onConflict: 'fixture_id,bookmaker_id,bet_id,value' });

                if (error) {
                  console.error('Error syncing odds:', error);
                  errors++;
                } else {
                  synced++;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing odds:', error);
          errors++;
        }
      }

      console.log(`✅ Odds sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching odds from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncPredictions(fixtureId: number): Promise<{ synced: number; errors: number }> {
    console.log(`🔮 Syncing predictions for fixture ${fixtureId}...`);
    let synced = 0;
    let errors = 0;

    try {
      const response = await apiFootballClient.getPredictions(fixtureId);
      const predictions = response.response || [];

      for (const prediction of predictions) {
        try {
          const predictionData = {
            fixture_id: fixtureId,
            winner_id: prediction.predictions?.winner?.id,
            winner_name: prediction.predictions?.winner?.name,
            winner_comment: prediction.predictions?.winner?.comment,
            win_or_draw: prediction.predictions?.win_or_draw,
            under_over: prediction.predictions?.under_over,
            goals_home: prediction.predictions?.goals?.home,
            goals_away: prediction.predictions?.goals?.away,
            advice: prediction.predictions?.advice,
            percent_home: parseFloat(prediction.predictions?.percent?.home?.replace('%', '') || '0'),
            percent_draw: parseFloat(prediction.predictions?.percent?.draw?.replace('%', '') || '0'),
            percent_away: parseFloat(prediction.predictions?.percent?.away?.replace('%', '') || '0'),
          };

          const { error } = await supabase
            .from('predictions')
            .upsert(predictionData, { onConflict: 'fixture_id' });

          if (error) {
            console.error('Error syncing prediction:', error);
            errors++;
          } else {
            synced++;
          }
        } catch (error) {
          console.error('Error processing prediction:', error);
          errors++;
        }
      }

      console.log(`✅ Predictions sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching predictions from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncInjuries(params: { league?: number; season?: number; team?: number; player?: number } = {}): Promise<{ synced: number; errors: number }> {
    console.log('🏥 Syncing injuries...');
    let synced = 0;
    let errors = 0;

    try {
      const response = await apiFootballClient.getInjuries(params);
      const injuries = response.response || [];

      for (const injury of injuries) {
        try {
          const injuryData = {
            player_id: injury.player.id,
            team_id: injury.team.id,
            fixture_id: injury.fixture?.id,
            league_id: injury.league?.id,
            season_year: injury.league?.season,
            type: injury.player.type,
            reason: injury.player.reason,
            date: injury.fixture?.date,
          };

          const { error } = await supabase
            .from('injuries')
            .upsert(injuryData, { onConflict: 'player_id,team_id,date' });

          if (error) {
            console.error('Error syncing injury:', error);
            errors++;
          } else {
            synced++;
          }
        } catch (error) {
          console.error('Error processing injury:', error);
          errors++;
        }
      }

      console.log(`✅ Injuries sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching injuries from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncTransfers(params: { player?: number; team?: number } = {}): Promise<{ synced: number; errors: number }> {
    console.log('🔄 Syncing transfers...');
    let synced = 0;
    let errors = 0;

    try {
      const response = await apiFootballClient.getTransfers(params);
      const transfers = response.response || [];

      for (const transferGroup of transfers) {
        for (const transfer of transferGroup.transfers || []) {
          try {
            const transferData = {
              player_id: transferGroup.player.id,
              date: transfer.date,
              type: transfer.type,
              team_in_id: transfer.teams?.in?.id,
              team_out_id: transfer.teams?.out?.id,
            };

            const { error } = await supabase
              .from('transfers')
              .upsert(transferData, { onConflict: 'player_id,date,team_in_id,team_out_id' });

            if (error) {
              console.error('Error syncing transfer:', error);
              errors++;
            } else {
              synced++;
            }
          } catch (error) {
            console.error('Error processing transfer:', error);
            errors++;
          }
        }
      }

      console.log(`✅ Transfers sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching transfers from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  static async syncCoaches(params: { team?: number; search?: string } = {}): Promise<{ synced: number; errors: number }> {
    console.log('👨‍💼 Syncing coaches...');
    let synced = 0;
    let errors = 0;

    try {
      const response = await apiFootballClient.getCoaches(params);
      const coaches = response.response || [];

      for (const coach of coaches) {
        try {
          const coachData = {
            id: coach.id,
            name: coach.name,
            firstname: coach.firstname,
            lastname: coach.lastname,
            age: coach.age,
            birth_date: coach.birth?.date,
            birth_place: coach.birth?.place,
            birth_country: coach.birth?.country,
            nationality: coach.nationality,
            height: coach.height,
            weight: coach.weight,
            photo: coach.photo,
          };

          const { error } = await supabase
            .from('coaches')
            .upsert(coachData, { onConflict: 'id' });

          if (error) {
            console.error('Error syncing coach:', error);
            errors++;
          } else {
            synced++;
          }
        } catch (error) {
          console.error('Error processing coach:', error);
          errors++;
        }
      }

      console.log(`✅ Coaches sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('Error fetching coaches from API:', error);
      errors++;
    }

    return { synced, errors };
  }

  // Comprehensive sync method for all tables
  static async syncAllTables(): Promise<{ success: boolean; message: string; details: any }> {
    if (this.isRunning) {
      return { success: false, message: 'Sync already in progress', details: {} };
    }

    this.isRunning = true;
    const results: any = {};
    const startTime = Date.now();

    try {
      console.log('🚀 Starting comprehensive data synchronization for all tables...');

      // Basic data (dependencies first)
      console.log('📋 Phase 1: Basic Data');
      results.countries = await this.syncCountries();
      results.leagues = await this.syncLeagues();
      results.venues = await this.syncVenues();
      results.teams = await this.syncTeams();
      results.coaches = await this.syncCoaches();

      // Match data
      console.log('📋 Phase 2: Match Data');
      results.fixtures = await this.syncFixtures();
      results.standings = await this.syncStandings(39, new Date().getFullYear()); // Premier League example

      // Player data
      console.log('📋 Phase 3: Player Data');
      results.players = await this.syncMajorLeaguePlayers();

      // Additional data
      console.log('📋 Phase 4: Additional Data');
      results.injuries = await this.syncInjuries({ league: 39, season: new Date().getFullYear() });
      results.transfers = await this.syncTransfers();

      const duration = Date.now() - startTime;
      console.log(`✅ Comprehensive sync completed in ${duration}ms`);

      return {
        success: true,
        message: `Comprehensive synchronization completed successfully in ${Math.round(duration/1000)}s`,
        details: results
      };
    } catch (error) {
      console.error('❌ Comprehensive synchronization failed:', error);
      return {
        success: false,
        message: `Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: results
      };
    } finally {
      this.isRunning = false;
    }
  }
}

export default DataSyncService;
