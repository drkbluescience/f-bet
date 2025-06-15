const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Add sample fixtures for testing
 */
async function addSampleFixtures() {
  console.log('🚀 Adding sample fixtures for testing...\n');

  // Sample fixtures data
  const sampleFixtures = [
    {
      id: 1001,
      referee: 'Michael Oliver',
      timezone: 'UTC',
      date: new Date().toISOString(),
      timestamp: Math.floor(Date.now() / 1000),
      venue_id: 556, // Old Trafford (should exist from teams sync)
      status_long: 'Match Finished',
      status_short: 'FT',
      status_elapsed: 90,
      league_id: 39, // Premier League
      season_year: 2024,
      round: 'Regular Season - 15',
      home_team_id: 33, // Manchester United
      away_team_id: 34, // Newcastle
      home_goals: 2,
      away_goals: 1,
      home_goals_halftime: 1,
      away_goals_halftime: 0,
      home_goals_extratime: null,
      away_goals_extratime: null,
      home_goals_penalty: null,
      away_goals_penalty: null
    },
    {
      id: 1002,
      referee: 'Anthony Taylor',
      timezone: 'UTC',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      timestamp: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000),
      venue_id: 494, // Stamford Bridge
      status_long: 'Not Started',
      status_short: 'NS',
      status_elapsed: null,
      league_id: 39, // Premier League
      season_year: 2024,
      round: 'Regular Season - 16',
      home_team_id: 49, // Chelsea
      away_team_id: 40, // Liverpool
      home_goals: null,
      away_goals: null,
      home_goals_halftime: null,
      away_goals_halftime: null,
      home_goals_extratime: null,
      away_goals_extratime: null,
      home_goals_penalty: null,
      away_goals_penalty: null
    },
    {
      id: 1003,
      referee: 'Craig Pawson',
      timezone: 'UTC',
      date: new Date().toISOString(),
      timestamp: Math.floor(Date.now() / 1000),
      venue_id: 508, // Emirates Stadium
      status_long: 'Second Half',
      status_short: 'LIVE',
      status_elapsed: 67,
      league_id: 39, // Premier League
      season_year: 2024,
      round: 'Regular Season - 15',
      home_team_id: 42, // Arsenal
      away_team_id: 50, // Manchester City
      home_goals: 1,
      away_goals: 2,
      home_goals_halftime: 0,
      away_goals_halftime: 1,
      home_goals_extratime: null,
      away_goals_extratime: null,
      home_goals_penalty: null,
      away_goals_penalty: null
    },
    {
      id: 1004,
      referee: 'Mateu Lahoz',
      timezone: 'UTC',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      timestamp: Math.floor((Date.now() + 2 * 24 * 60 * 60 * 1000) / 1000),
      venue_id: 1456, // Santiago Bernabéu
      status_long: 'Not Started',
      status_short: 'NS',
      status_elapsed: null,
      league_id: 140, // La Liga
      season_year: 2024,
      round: 'Regular Season - 16',
      home_team_id: 541, // Real Madrid
      away_team_id: 529, // Barcelona
      home_goals: null,
      away_goals: null,
      home_goals_halftime: null,
      away_goals_halftime: null,
      home_goals_extratime: null,
      away_goals_extratime: null,
      home_goals_penalty: null,
      away_goals_penalty: null
    },
    {
      id: 1005,
      referee: 'Cüneyt Çakır',
      timezone: 'UTC',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      timestamp: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000),
      venue_id: 1307, // Türk Telekom Stadium
      status_long: 'Match Finished',
      status_short: 'FT',
      status_elapsed: 90,
      league_id: 203, // Süper Lig
      season_year: 2024,
      round: 'Regular Season - 15',
      home_team_id: 645, // Galatasaray
      away_team_id: 641, // Fenerbahçe
      home_goals: 3,
      away_goals: 1,
      home_goals_halftime: 2,
      away_goals_halftime: 0,
      home_goals_extratime: null,
      away_goals_extratime: null,
      home_goals_penalty: null,
      away_goals_penalty: null
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const fixture of sampleFixtures) {
    try {
      console.log(`📝 Adding fixture: ${fixture.id}...`);
      
      const { data, error } = await supabase
        .from('fixtures')
        .insert([fixture])
        .select();

      if (error) {
        console.log(`❌ Failed to add fixture ${fixture.id}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Fixture ${fixture.id} added successfully`);
        successCount++;
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.error(`❌ Exception adding fixture ${fixture.id}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} fixtures added, ${errorCount} errors`);
  
  if (successCount > 0) {
    console.log('✅ Sample fixtures added successfully!');
    return true;
  } else {
    console.log('❌ Failed to add sample fixtures');
    return false;
  }
}

/**
 * Verify fixtures were added
 */
async function verifyFixtures() {
  console.log('🔍 Verifying fixtures...');
  
  try {
    const { data, error } = await supabase
      .from('fixtures')
      .select('id, home_team_id, away_team_id, status_short')
      .limit(10);

    if (error) {
      console.log(`❌ Failed to verify fixtures:`, error.message);
      return false;
    }

    console.log(`✅ Found ${data.length} fixtures in database`);
    if (data.length > 0) {
      console.log('📋 Sample fixtures:');
      data.forEach(fixture => {
        console.log(`   - Fixture ${fixture.id}: Team ${fixture.home_team_id} vs Team ${fixture.away_team_id} (${fixture.status_short})`);
      });
    }
    
    return true;
  } catch (err) {
    console.log(`❌ Verification failed:`, err.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting sample fixtures setup...\n');
    
    // Add sample fixtures
    const fixturesAdded = await addSampleFixtures();
    console.log('');
    
    if (fixturesAdded) {
      // Verify fixtures
      const verified = await verifyFixtures();
      console.log('');
      
      if (verified) {
        console.log('🎉 Sample fixtures setup completed successfully!');
        console.log('📋 You can now test the match details functionality');
        return true;
      }
    }
    
    console.log('❌ Sample fixtures setup completed with errors');
    return false;
    
  } catch (error) {
    console.error('❌ Sample fixtures setup failed:', error.message);
    return false;
  }
}

// Run the script
main()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
