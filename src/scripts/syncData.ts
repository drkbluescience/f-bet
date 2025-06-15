import { supabase } from '../services/supabaseClient';

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY;

interface ApiResponse<T> {
  get: string;
  parameters: any;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

/**
 * Make API request to API-Football
 */
async function makeApiRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T[]> {
  const url = new URL(`${API_FOOTBALL_BASE_URL}${endpoint}`);
  
  // Add parameters to URL
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  console.log(`🌐 Making API request: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': API_KEY!,
      'X-RapidAPI-Host': 'v3.football.api-sports.io'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(`API errors: ${JSON.stringify(data.errors)}`);
  }

  console.log(`✅ API request successful: ${data.results} results`);
  return data.response;
}

/**
 * Sync countries data
 */
export async function syncCountries(): Promise<void> {
  console.log('🌍 Syncing countries...');
  
  try {
    const countries = await makeApiRequest<any>('/countries');
    
    for (const country of countries) {
      const { error } = await supabase
        .from('countries')
        .upsert({
          name: country.name,
          code: country.code,
          flag: country.flag
        }, {
          onConflict: 'name'
        });

      if (error) {
        console.error(`Error inserting country ${country.name}:`, error);
      }
    }
    
    console.log(`✅ Synced ${countries.length} countries`);
  } catch (error) {
    console.error('❌ Failed to sync countries:', error);
    throw error;
  }
}

/**
 * Sync leagues data
 */
export async function syncLeagues(): Promise<void> {
  console.log('🏆 Syncing leagues...');
  
  try {
    const leagues = await makeApiRequest<any>('/leagues');
    
    for (const item of leagues) {
      const league = item.league;
      const country = item.country;
      
      // Get country ID
      let countryId = null;
      if (country && country.name) {
        const { data: countryData } = await supabase
          .from('countries')
          .select('id')
          .eq('name', country.name)
          .single();
        
        countryId = countryData?.id;
      }
      
      const { error } = await supabase
        .from('leagues')
        .upsert({
          id: league.id,
          name: league.name,
          type: league.type,
          logo: league.logo,
          country_id: countryId
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error(`Error inserting league ${league.name}:`, error);
      }
    }
    
    console.log(`✅ Synced ${leagues.length} leagues`);
  } catch (error) {
    console.error('❌ Failed to sync leagues:', error);
    throw error;
  }
}

/**
 * Sync seasons for a specific league
 */
export async function syncSeasons(leagueId: number): Promise<void> {
  console.log(`📅 Syncing seasons for league ${leagueId}...`);
  
  try {
    const seasons = await makeApiRequest<any>('/leagues/seasons', { league: leagueId });
    
    for (const season of seasons) {
      const { error } = await supabase
        .from('seasons')
        .upsert({
          league_id: leagueId,
          year: season.year,
          start_date: season.start,
          end_date: season.end,
          current: season.current || false
        }, {
          onConflict: 'league_id,year'
        });

      if (error) {
        console.error(`Error inserting season ${season.year} for league ${leagueId}:`, error);
      }
    }
    
    console.log(`✅ Synced ${seasons.length} seasons for league ${leagueId}`);
  } catch (error) {
    console.error(`❌ Failed to sync seasons for league ${leagueId}:`, error);
    throw error;
  }
}

/**
 * Sync venues data
 */
export async function syncVenues(): Promise<void> {
  console.log('🏟️ Syncing venues...');
  
  try {
    const venues = await makeApiRequest<any>('/venues');
    
    for (const venue of venues) {
      const { error } = await supabase
        .from('venues')
        .upsert({
          id: venue.id,
          name: venue.name,
          address: venue.address,
          city: venue.city,
          country: venue.country,
          capacity: venue.capacity,
          surface: venue.surface,
          image: venue.image
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error(`Error inserting venue ${venue.name}:`, error);
      }
    }
    
    console.log(`✅ Synced ${venues.length} venues`);
  } catch (error) {
    console.error('❌ Failed to sync venues:', error);
    throw error;
  }
}

/**
 * Sync teams for a specific league and season
 */
export async function syncTeams(leagueId: number, season: number): Promise<void> {
  console.log(`⚽ Syncing teams for league ${leagueId}, season ${season}...`);
  
  try {
    const teams = await makeApiRequest<any>('/teams', { 
      league: leagueId, 
      season: season 
    });
    
    for (const item of teams) {
      const team = item.team;
      const venue = item.venue;
      
      // Insert venue if it doesn't exist
      let venueId = null;
      if (venue && venue.id) {
        const { error: venueError } = await supabase
          .from('venues')
          .upsert({
            id: venue.id,
            name: venue.name,
            address: venue.address,
            city: venue.city,
            country: venue.country,
            capacity: venue.capacity,
            surface: venue.surface,
            image: venue.image
          }, {
            onConflict: 'id'
          });
          
        if (!venueError) {
          venueId = venue.id;
        }
      }
      
      const { error } = await supabase
        .from('teams')
        .upsert({
          id: team.id,
          name: team.name,
          code: team.code,
          country: team.country,
          founded: team.founded,
          national: team.national || false,
          logo: team.logo,
          venue_id: venueId
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error(`Error inserting team ${team.name}:`, error);
      }
    }
    
    console.log(`✅ Synced ${teams.length} teams for league ${leagueId}, season ${season}`);
  } catch (error) {
    console.error(`❌ Failed to sync teams for league ${leagueId}, season ${season}:`, error);
    throw error;
  }
}

/**
 * Sync fixtures for a specific league and season
 */
export async function syncFixtures(leagueId: number, season: number, from?: string, to?: string): Promise<void> {
  console.log(`🎯 Syncing fixtures for league ${leagueId}, season ${season}...`);
  
  try {
    const params: any = { league: leagueId, season: season };
    if (from) params.from = from;
    if (to) params.to = to;
    
    const fixtures = await makeApiRequest<any>('/fixtures', params);
    
    for (const item of fixtures) {
      const fixture = item.fixture;
      const league = item.league;
      const teams = item.teams;
      const goals = item.goals;
      const score = item.score;
      
      const { error } = await supabase
        .from('fixtures')
        .upsert({
          id: fixture.id,
          referee: fixture.referee,
          timezone: fixture.timezone,
          date: fixture.date,
          timestamp: fixture.timestamp,
          venue_id: fixture.venue?.id,
          status_long: fixture.status?.long,
          status_short: fixture.status?.short,
          status_elapsed: fixture.status?.elapsed,
          league_id: league.id,
          season_year: league.season,
          round: league.round,
          home_team_id: teams.home?.id,
          away_team_id: teams.away?.id,
          home_goals: goals.home,
          away_goals: goals.away,
          home_goals_halftime: score.halftime?.home,
          away_goals_halftime: score.halftime?.away,
          home_goals_extratime: score.extratime?.home,
          away_goals_extratime: score.extratime?.away,
          home_goals_penalty: score.penalty?.home,
          away_goals_penalty: score.penalty?.away
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error(`Error inserting fixture ${fixture.id}:`, error);
      }
    }
    
    console.log(`✅ Synced ${fixtures.length} fixtures for league ${leagueId}, season ${season}`);
  } catch (error) {
    console.error(`❌ Failed to sync fixtures for league ${leagueId}, season ${season}:`, error);
    throw error;
  }
}

/**
 * Sync league standings
 */
export async function syncStandings(leagueId: number, season: number): Promise<void> {
  console.log(`📊 Syncing standings for league ${leagueId}, season ${season}...`);

  try {
    const standings = await makeApiRequest<any>('/standings', {
      league: leagueId,
      season: season
    });

    for (const standingGroup of standings) {
      const league = standingGroup.league;

      for (const standing of league.standings) {
        for (const teamStanding of standing) {
          const { error } = await supabase
            .from('league_standings')
            .upsert({
              league_id: leagueId,
              season_year: season,
              team_id: teamStanding.team.id,
              rank: teamStanding.rank,
              points: teamStanding.points,
              goalsDiff: teamStanding.goalsDiff,
              group_name: teamStanding.group,
              form: teamStanding.form,
              status: teamStanding.status,
              description: teamStanding.description,
              played: teamStanding.all?.played,
              win: teamStanding.all?.win,
              draw: teamStanding.all?.draw,
              lose: teamStanding.all?.lose,
              goals_for: teamStanding.all?.goals?.for,
              goals_against: teamStanding.all?.goals?.against
            }, {
              onConflict: 'league_id,season_year,team_id'
            });

          if (error) {
            console.error(`Error inserting standing for team ${teamStanding.team.id}:`, error);
          }
        }
      }
    }

    console.log(`✅ Synced standings for league ${leagueId}, season ${season}`);
  } catch (error) {
    console.error(`❌ Failed to sync standings for league ${leagueId}, season ${season}:`, error);
    throw error;
  }
}

/**
 * Sync predictions for a fixture
 */
export async function syncPredictions(fixtureId: number): Promise<void> {
  console.log(`🔮 Syncing predictions for fixture ${fixtureId}...`);

  try {
    const predictions = await makeApiRequest<any>('/predictions', {
      fixture: fixtureId
    });

    for (const prediction of predictions) {
      const { error } = await supabase
        .from('predictions')
        .upsert({
          fixture_id: fixtureId,
          winner_id: prediction.teams?.home?.id,
          winner_comment: prediction.winner?.comment,
          win_or_draw: prediction.win_or_draw,
          under_over: prediction.under_over,
          goals_home: prediction.goals?.home,
          goals_away: prediction.goals?.away,
          advice: prediction.advice,
          percent_home: prediction.percent?.home ? parseInt(prediction.percent.home) : null,
          percent_draw: prediction.percent?.draw ? parseInt(prediction.percent.draw) : null,
          percent_away: prediction.percent?.away ? parseInt(prediction.percent.away) : null
        }, {
          onConflict: 'fixture_id'
        });

      if (error) {
        console.error(`Error inserting prediction for fixture ${fixtureId}:`, error);
      }
    }

    console.log(`✅ Synced predictions for fixture ${fixtureId}`);
  } catch (error) {
    console.error(`❌ Failed to sync predictions for fixture ${fixtureId}:`, error);
    throw error;
  }
}

/**
 * Main sync function - syncs all data for popular leagues
 */
export async function syncAllData(): Promise<void> {
  console.log('🚀 Starting full data synchronization...');

  try {
    // Popular league IDs
    const popularLeagues = [
      { id: 39, name: 'Premier League' },      // England
      { id: 140, name: 'La Liga' },            // Spain
      { id: 78, name: 'Bundesliga' },          // Germany
      { id: 135, name: 'Serie A' },            // Italy
      { id: 61, name: 'Ligue 1' },             // France
      { id: 2, name: 'Champions League' },     // UEFA
      { id: 203, name: 'Süper Lig' }           // Turkey
    ];

    const currentSeason = 2024;

    // 1. Sync countries
    await syncCountries();

    // 2. Sync leagues
    await syncLeagues();

    // 3. Sync venues
    await syncVenues();

    // 4. Sync data for each popular league
    for (const league of popularLeagues) {
      console.log(`\n🏆 Processing ${league.name} (ID: ${league.id})...`);

      try {
        // Sync seasons
        await syncSeasons(league.id);

        // Sync teams
        await syncTeams(league.id, currentSeason);

        // Sync recent fixtures (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const today = new Date();

        await syncFixtures(
          league.id,
          currentSeason,
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );

        // Sync standings
        await syncStandings(league.id, currentSeason);

        console.log(`✅ Completed ${league.name}`);

        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Failed to sync ${league.name}:`, error);
        // Continue with next league
      }
    }

    console.log('\n🎉 Full data synchronization completed!');

  } catch (error) {
    console.error('❌ Failed to sync all data:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  syncAllData()
    .then(() => {
      console.log('✅ Sync script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sync script failed:', error);
      process.exit(1);
    });
}
