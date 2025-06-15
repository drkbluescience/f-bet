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
 * Test fixture details functionality
 */
async function testFixtureDetails() {
  console.log('🚀 Testing fixture details functionality...\n');

  try {
    // First, get list of available fixtures
    console.log('📋 Getting available fixtures...');
    const { data: fixtures, error: listError } = await supabase
      .from('fixtures')
      .select('id, home_team_id, away_team_id, status_short')
      .limit(5);

    if (listError) {
      console.error('❌ Failed to get fixtures:', listError.message);
      return false;
    }

    if (!fixtures || fixtures.length === 0) {
      console.log('⚠️  No fixtures found in database');
      return false;
    }

    console.log(`✅ Found ${fixtures.length} fixtures`);
    fixtures.forEach(fixture => {
      console.log(`   - Fixture ${fixture.id}: Team ${fixture.home_team_id} vs Team ${fixture.away_team_id} (${fixture.status_short})`);
    });

    // Test getting detailed fixture information
    const testFixtureId = fixtures[0].id;
    console.log(`\n🔍 Testing fixture details for fixture ${testFixtureId}...`);

    const { data: fixtureDetail, error: detailError } = await supabase
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
      .eq('id', testFixtureId)
      .single();

    if (detailError) {
      console.error('❌ Failed to get fixture details:', detailError.message);
      return false;
    }

    console.log('✅ Fixture details retrieved successfully!');
    console.log('📊 Fixture data structure:');
    console.log(JSON.stringify({
      id: fixtureDetail.id,
      date: fixtureDetail.date,
      status_short: fixtureDetail.status_short,
      status_long: fixtureDetail.status_long,
      home_team: fixtureDetail.home_team ? {
        id: fixtureDetail.home_team.id,
        name: fixtureDetail.home_team.name
      } : null,
      away_team: fixtureDetail.away_team ? {
        id: fixtureDetail.away_team.id,
        name: fixtureDetail.away_team.name
      } : null,
      league: fixtureDetail.league ? {
        id: fixtureDetail.league.id,
        name: fixtureDetail.league.name
      } : null,
      venue: fixtureDetail.venue ? {
        id: fixtureDetail.venue.id,
        name: fixtureDetail.venue.name
      } : null,
      home_goals: fixtureDetail.home_goals,
      away_goals: fixtureDetail.away_goals,
      referee: fixtureDetail.referee
    }, null, 2));

    // Test the transformation that would happen in the service
    console.log('\n🔄 Testing data transformation...');
    const transformedFixture = {
      fixture_id: fixtureDetail.id,
      league_id: fixtureDetail.league_id,
      season_year: fixtureDetail.season_year,
      date_utc: fixtureDetail.date,
      status: fixtureDetail.status_short || fixtureDetail.status_long,
      home_team_id: fixtureDetail.home_team_id,
      away_team_id: fixtureDetail.away_team_id,
      venue_id: fixtureDetail.venue_id,
      referee: fixtureDetail.referee,
      home_goals: fixtureDetail.home_goals,
      away_goals: fixtureDetail.away_goals,
      updated_at: fixtureDetail.updated_at,
      home_team: fixtureDetail.home_team ? {
        team_id: fixtureDetail.home_team.id,
        name: fixtureDetail.home_team.name,
        logo_url: fixtureDetail.home_team.logo,
        created_at: '',
        updated_at: ''
      } : undefined,
      away_team: fixtureDetail.away_team ? {
        team_id: fixtureDetail.away_team.id,
        name: fixtureDetail.away_team.name,
        logo_url: fixtureDetail.away_team.logo,
        created_at: '',
        updated_at: ''
      } : undefined,
      league: fixtureDetail.league ? {
        league_id: fixtureDetail.league.id,
        name: fixtureDetail.league.name,
        country_id: 0,
        season_year: fixtureDetail.season_year,
        logo_url: fixtureDetail.league.logo,
        created_at: '',
        updated_at: ''
      } : undefined,
      venue: fixtureDetail.venue ? {
        venue_id: fixtureDetail.venue.id,
        name: fixtureDetail.venue.name,
        city: fixtureDetail.venue.city,
        updated_at: ''
      } : undefined
    };

    console.log('✅ Data transformation successful!');
    console.log('📊 Transformed fixture (for React Native app):');
    console.log(JSON.stringify({
      fixture_id: transformedFixture.fixture_id,
      status: transformedFixture.status,
      date_utc: transformedFixture.date_utc,
      home_team: transformedFixture.home_team ? {
        name: transformedFixture.home_team.name
      } : null,
      away_team: transformedFixture.away_team ? {
        name: transformedFixture.away_team.name
      } : null,
      league: transformedFixture.league ? {
        name: transformedFixture.league.name
      } : null,
      venue: transformedFixture.venue ? {
        name: transformedFixture.venue.name
      } : null,
      home_goals: transformedFixture.home_goals,
      away_goals: transformedFixture.away_goals,
      referee: transformedFixture.referee
    }, null, 2));

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting fixture details test...\n');
    
    const success = await testFixtureDetails();
    
    if (success) {
      console.log('\n🎉 All tests passed!');
      console.log('📋 The match details functionality should work correctly');
      console.log('💡 You can now test clicking on fixtures in the app to see their details');
      return true;
    } else {
      console.log('\n❌ Tests failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test script failed:', error.message);
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
