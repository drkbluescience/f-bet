const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Polyfill for Node.js
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

// Configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rekwozaixnrdchqrzokk.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJla3dvemFpeG5yZGNocXJ6b2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NzM3NTksImV4cCI6MjA2NTA0OTc1OX0.cWNeBeFxzsEy4ESVxILVpCYIc7gmn6vBO3H9Y72unKc';
const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || '65ded8ae3bf506066acc2e2343b6eec9';

const supabase = createClient(supabaseUrl, supabaseKey);

// Data tracking function
async function logDataSync(log) {
  try {
    const { error } = await supabase
      .from('data_sync_logs')
      .insert([{
        ...log,
        sync_date: log.sync_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      }]);

    if (error) {
      console.warn('Failed to log data sync:', error.message);
    }
  } catch (error) {
    console.warn('Error logging data sync:', error.message);
  }
}

/**
 * Make API request to API-Football with tracking
 */
async function makeApiRequest(endpoint, params = {}) {
  const startTime = Date.now();
  const url = new URL(`https://v3.football.api-sports.io${endpoint}`);

  // Add parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  console.log(`🌐 API Request: ${endpoint} ${JSON.stringify(params)}`);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      // Log failed API call
      await logDataSync({
        table_name: `api_${endpoint.replace('/', '_')}`,
        records_added: 0,
        records_updated: 0,
        api_calls_used: 1,
        sync_duration_ms: duration,
        status: 'error',
        error_message: `API request failed: ${response.status} ${response.statusText}`,
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      // Log API error
      await logDataSync({
        table_name: `api_${endpoint.replace('/', '_')}`,
        records_added: 0,
        records_updated: 0,
        api_calls_used: 1,
        sync_duration_ms: duration,
        status: 'error',
        error_message: `API errors: ${JSON.stringify(data.errors)}`,
      });
      throw new Error(`API errors: ${JSON.stringify(data.errors)}`);
    }

    // Log successful API call
    const recordCount = data.response ? (Array.isArray(data.response) ? data.response.length : 1) : 0;
    await logDataSync({
      table_name: `api_${endpoint.replace('/', '_')}`,
      records_added: recordCount,
      records_updated: 0,
      api_calls_used: 1,
      sync_duration_ms: duration,
      status: 'success',
    });

    console.log(`✅ API Response: ${data.results} results (${duration}ms)`);
    return data.response;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log exception
    await logDataSync({
      table_name: `api_${endpoint.replace('/', '_')}`,
      records_added: 0,
      records_updated: 0,
      api_calls_used: 1,
      sync_duration_ms: duration,
      status: 'error',
      error_message: error.message,
    });

    throw error;
  }
}

/**
 * Sync countries
 */
async function syncCountries() {
  console.log('🌍 Syncing countries...');
  const startTime = Date.now();

  try {
    const countries = await makeApiRequest('/countries');
    let insertedCount = 0;
    let errorCount = 0;

    for (const country of countries.slice(0, 50)) { // Limit to first 50 for testing
      try {
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
          console.log(`❌ Error inserting ${country.name}: ${error.message}`);
          errorCount++;
        } else {
          insertedCount++;
        }
      } catch (err) {
        console.log(`❌ Exception inserting ${country.name}: ${err.message}`);
        errorCount++;
      }
    }

    // Log database sync
    const duration = Date.now() - startTime;
    await logDataSync({
      table_name: 'countries',
      records_added: insertedCount,
      records_updated: 0,
      api_calls_used: 1,
      sync_duration_ms: duration,
      status: errorCount === 0 ? 'success' : (insertedCount > 0 ? 'partial' : 'error'),
      error_message: errorCount > 0 ? `${errorCount} insertion errors` : null,
    });

    console.log(`✅ Countries: ${insertedCount} inserted, ${errorCount} errors (${duration}ms)`);
    return insertedCount;

  } catch (error) {
    const duration = Date.now() - startTime;
    await logDataSync({
      table_name: 'countries',
      records_added: 0,
      records_updated: 0,
      api_calls_used: 1,
      sync_duration_ms: duration,
      status: 'error',
      error_message: error.message,
    });

    console.error('❌ Failed to sync countries:', error.message);
    return 0;
  }
}

/**
 * Sync leagues
 */
async function syncLeagues() {
  console.log('🏆 Syncing leagues...');
  
  try {
    const leagues = await makeApiRequest('/leagues');
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const item of leagues.slice(0, 100)) { // Limit for testing
      try {
        const league = item.league;
        const country = item.country;
        
        // Get country ID if exists
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
          console.log(`❌ Error inserting ${league.name}: ${error.message}`);
          errorCount++;
        } else {
          insertedCount++;
        }
      } catch (err) {
        console.log(`❌ Exception inserting league: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ Leagues: ${insertedCount} inserted, ${errorCount} errors`);
    return insertedCount;
    
  } catch (error) {
    console.error('❌ Failed to sync leagues:', error.message);
    return 0;
  }
}

/**
 * Sync teams for specific leagues
 */
async function syncTeams() {
  console.log('⚽ Syncing teams...');
  
  // Popular leagues to sync
  const popularLeagues = [
    { id: 39, name: 'Premier League' },
    { id: 140, name: 'La Liga' },
    { id: 203, name: 'Süper Lig' }
  ];
  
  const currentSeason = 2024;
  let totalInserted = 0;
  
  for (const league of popularLeagues) {
    try {
      console.log(`📋 Syncing teams for ${league.name}...`);
      
      const teams = await makeApiRequest('/teams', { 
        league: league.id, 
        season: currentSeason 
      });
      
      let insertedCount = 0;
      let errorCount = 0;
      
      for (const item of teams) {
        try {
          const team = item.team;
          const venue = item.venue;
          
          // Insert venue first if exists
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
            console.log(`❌ Error inserting ${team.name}: ${error.message}`);
            errorCount++;
          } else {
            insertedCount++;
          }
        } catch (err) {
          console.log(`❌ Exception inserting team: ${err.message}`);
          errorCount++;
        }
      }
      
      console.log(`✅ ${league.name}: ${insertedCount} teams inserted, ${errorCount} errors`);
      totalInserted += insertedCount;
      
      // Delay to respect API limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to sync teams for ${league.name}:`, error.message);
    }
  }
  
  console.log(`✅ Total teams inserted: ${totalInserted}`);
  return totalInserted;
}

/**
 * Sync recent fixtures
 */
async function syncFixtures() {
  console.log('🎯 Syncing recent fixtures...');
  
  try {
    // Get fixtures from last 7 days
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const fromDate = weekAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    console.log(`📅 Fetching fixtures from ${fromDate} to ${toDate}`);
    
    const fixtures = await makeApiRequest('/fixtures', { 
      from: fromDate,
      to: toDate
    });
    
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const item of fixtures.slice(0, 50)) { // Limit for testing
      try {
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
          console.log(`❌ Error inserting fixture ${fixture.id}: ${error.message}`);
          errorCount++;
        } else {
          insertedCount++;
        }
      } catch (err) {
        console.log(`❌ Exception inserting fixture: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ Fixtures: ${insertedCount} inserted, ${errorCount} errors`);
    return insertedCount;
    
  } catch (error) {
    console.error('❌ Failed to sync fixtures:', error.message);
    return 0;
  }
}

/**
 * Main sync function
 */
async function syncAllData() {
  console.log('🚀 Starting data synchronization...\n');
  
  const results = {
    countries: 0,
    leagues: 0,
    teams: 0,
    fixtures: 0
  };
  
  try {
    // Check API usage first
    console.log('📊 Checking API usage...');
    const usage = await makeApiRequest('/status');
    console.log(`📈 API Usage: ${usage.requests.current}/${usage.requests.limit_day}`);
    console.log('');
    
    // Sync in order (dependencies matter)
    results.countries = await syncCountries();
    console.log('');
    
    results.leagues = await syncLeagues();
    console.log('');
    
    results.teams = await syncTeams();
    console.log('');
    
    results.fixtures = await syncFixtures();
    console.log('');
    
    // Summary
    const totalRecords = Object.values(results).reduce((sum, count) => sum + count, 0);
    
    console.log('📋 SYNC SUMMARY:');
    console.log(`   Countries: ${results.countries}`);
    console.log(`   Leagues: ${results.leagues}`);
    console.log(`   Teams: ${results.teams}`);
    console.log(`   Fixtures: ${results.fixtures}`);
    console.log(`   Total: ${totalRecords} records`);
    
    if (totalRecords > 0) {
      console.log('\n🎉 Data synchronization completed successfully!');
      console.log('📋 Next: Check data with "npm run db:check"');
      return true;
    } else {
      console.log('\n⚠️  No data was synchronized!');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    return false;
  }
}

// Run the sync
syncAllData()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
