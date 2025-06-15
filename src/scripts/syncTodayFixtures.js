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

/**
 * Make API request to API-Football
 */
async function makeApiRequest(endpoint, params = {}) {
  const url = new URL(`https://v3.football.api-sports.io${endpoint}`);
  
  // Add parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  console.log(`🌐 API Request: ${endpoint} ${JSON.stringify(params)}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'v3.football.api-sports.io'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(`API errors: ${JSON.stringify(data.errors)}`);
  }

  console.log(`✅ API Response: ${data.results} results`);
  return data.response;
}

/**
 * Sync today's fixtures
 */
async function syncTodayFixtures() {
  console.log('🎯 Syncing today\'s fixtures...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Fetching fixtures for ${today}`);
    
    const fixtures = await makeApiRequest('/fixtures', { 
      date: today
    });
    
    let insertedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    console.log(`📊 Processing ${fixtures.length} fixtures...`);
    
    for (const item of fixtures) {
      try {
        const fixture = item.fixture;
        const league = item.league;
        const teams = item.teams;
        const goals = item.goals;
        const score = item.score;
        
        // Check if teams exist in our database
        const { data: homeTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('id', teams.home?.id)
          .single();
          
        const { data: awayTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('id', teams.away?.id)
          .single();
        
        if (!homeTeam || !awayTeam) {
          // Skip fixtures where teams are not in our database
          skippedCount++;
          continue;
        }
        
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
          if (insertedCount % 10 === 0) {
            console.log(`📈 Progress: ${insertedCount} fixtures inserted...`);
          }
        }
      } catch (err) {
        console.log(`❌ Exception inserting fixture: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ Today's fixtures: ${insertedCount} inserted, ${skippedCount} skipped, ${errorCount} errors`);
    return insertedCount;
    
  } catch (error) {
    console.error('❌ Failed to sync today\'s fixtures:', error.message);
    return 0;
  }
}

/**
 * Sync live fixtures (currently playing)
 */
async function syncLiveFixtures() {
  console.log('🔴 Syncing live fixtures...');
  
  try {
    const fixtures = await makeApiRequest('/fixtures', { 
      live: 'all'
    });
    
    let updatedCount = 0;
    let errorCount = 0;
    
    console.log(`📊 Processing ${fixtures.length} live fixtures...`);
    
    for (const item of fixtures) {
      try {
        const fixture = item.fixture;
        const goals = item.goals;
        const score = item.score;
        
        const { error } = await supabase
          .from('fixtures')
          .update({
            status_long: fixture.status?.long,
            status_short: fixture.status?.short,
            status_elapsed: fixture.status?.elapsed,
            home_goals: goals.home,
            away_goals: goals.away,
            home_goals_halftime: score.halftime?.home,
            away_goals_halftime: score.halftime?.away,
            updated_at: new Date().toISOString()
          })
          .eq('id', fixture.id);

        if (error) {
          console.log(`❌ Error updating fixture ${fixture.id}: ${error.message}`);
          errorCount++;
        } else {
          updatedCount++;
        }
      } catch (err) {
        console.log(`❌ Exception updating fixture: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ Live fixtures: ${updatedCount} updated, ${errorCount} errors`);
    return updatedCount;
    
  } catch (error) {
    console.error('❌ Failed to sync live fixtures:', error.message);
    return 0;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Syncing today\'s and live fixtures...\n');
  
  try {
    // Check API usage
    console.log('📊 Checking API usage...');
    const usage = await makeApiRequest('/status');
    console.log(`📈 API Usage: ${usage.requests.current}/${usage.requests.limit_day}`);
    console.log('');
    
    // Sync today's fixtures
    const todayCount = await syncTodayFixtures();
    console.log('');
    
    // Sync live fixtures
    const liveCount = await syncLiveFixtures();
    console.log('');
    
    // Summary
    console.log('📋 SYNC SUMMARY:');
    console.log(`   Today's fixtures: ${todayCount}`);
    console.log(`   Live updates: ${liveCount}`);
    console.log(`   Total: ${todayCount + liveCount} operations`);
    
    if (todayCount > 0 || liveCount > 0) {
      console.log('\n🎉 Fixture synchronization completed successfully!');
      return true;
    } else {
      console.log('\n⚠️  No fixtures were synchronized!');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    return false;
  }
}

// Run the sync
main()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
