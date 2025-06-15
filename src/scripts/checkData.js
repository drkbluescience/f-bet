const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Polyfill for Node.js
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rekwozaixnrdchqrzokk.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJla3dvemFpeG5yZGNocXJ6b2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NzM3NTksImV4cCI6MjA2NTA0OTc1OX0.cWNeBeFxzsEy4ESVxILVpCYIc7gmn6vBO3H9Y72unKc';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check data in all tables
 */
async function checkAllTables() {
  console.log('🔍 Checking data in all tables...\n');
  
  const tables = [
    'countries',
    'leagues', 
    'seasons',
    'venues',
    'teams',
    'fixtures',
    'league_standings',
    'predictions'
  ];

  const results = {};
  let totalRecords = 0;

  for (const tableName of tables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(5);

      if (error) {
        console.log(`❌ ${tableName}: Error - ${error.message}`);
        results[tableName] = { status: 'error', count: 0, error: error.message };
      } else {
        const recordCount = count || 0;
        totalRecords += recordCount;
        console.log(`📊 ${tableName}: ${recordCount} records`);
        
        if (recordCount > 0 && data && data.length > 0) {
          console.log(`   Sample data:`, JSON.stringify(data[0], null, 2));
        }
        
        results[tableName] = { status: 'success', count: recordCount, sample: data?.[0] };
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Exception - ${err.message}`);
      results[tableName] = { status: 'exception', count: 0, error: err.message };
    }
    
    console.log(''); // Empty line for readability
  }

  console.log(`\n📈 Total records across all tables: ${totalRecords}`);
  
  return results;
}

/**
 * Check specific table with detailed info
 */
async function checkTableDetails(tableName) {
  console.log(`🔍 Detailed check for table: ${tableName}\n`);
  
  try {
    // Get count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`❌ Error getting count: ${countError.message}`);
      return;
    }

    console.log(`📊 Total records: ${count || 0}`);

    if (count && count > 0) {
      // Get sample data
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);

      if (error) {
        console.log(`❌ Error getting sample data: ${error.message}`);
      } else {
        console.log(`\n📋 Sample records:`);
        data.forEach((record, index) => {
          console.log(`\nRecord ${index + 1}:`);
          console.log(JSON.stringify(record, null, 2));
        });
      }
    } else {
      console.log(`📭 Table is empty`);
    }

  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
}

/**
 * Test API-Football connection and get sample data
 */
async function testAPIConnection() {
  console.log('🌐 Testing API-Football connection and getting sample data...\n');
  
  const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || '65ded8ae3bf506066acc2e2343b6eec9';
  
  try {
    // Test 1: Get countries
    console.log('📍 Testing countries endpoint...');
    const countriesResponse = await fetch('https://v3.football.api-sports.io/countries', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });

    if (countriesResponse.ok) {
      const countriesData = await countriesResponse.json();
      console.log(`✅ Countries: ${countriesData.results} available`);
      if (countriesData.response && countriesData.response.length > 0) {
        console.log(`   Sample: ${countriesData.response[0].name} (${countriesData.response[0].code})`);
      }
    }

    // Test 2: Get leagues
    console.log('\n🏆 Testing leagues endpoint...');
    const leaguesResponse = await fetch('https://v3.football.api-sports.io/leagues', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });

    if (leaguesResponse.ok) {
      const leaguesData = await leaguesResponse.json();
      console.log(`✅ Leagues: ${leaguesData.results} available`);
      if (leaguesData.response && leaguesData.response.length > 0) {
        const league = leaguesData.response[0].league;
        console.log(`   Sample: ${league.name} (ID: ${league.id})`);
      }
    }

    // Test 3: Get today's fixtures
    console.log('\n⚽ Testing fixtures endpoint (today)...');
    const today = new Date().toISOString().split('T')[0];
    const fixturesResponse = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });

    if (fixturesResponse.ok) {
      const fixturesData = await fixturesResponse.json();
      console.log(`✅ Today's fixtures: ${fixturesData.results} available`);
      if (fixturesData.response && fixturesData.response.length > 0) {
        const fixture = fixturesData.response[0];
        console.log(`   Sample: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      }
    }

    console.log('\n✅ API-Football connection working properly!');
    return true;

  } catch (error) {
    console.error('❌ API-Football test failed:', error.message);
    return false;
  }
}

/**
 * Get API usage statistics
 */
async function getAPIUsage() {
  console.log('📊 Checking API usage...\n');
  
  const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || '65ded8ae3bf506066acc2e2343b6eec9';
  
  try {
    const response = await fetch('https://v3.football.api-sports.io/status', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const status = data.response;
      
      console.log('📈 API Usage Statistics:');
      console.log(`   Plan: ${status.subscription.plan}`);
      console.log(`   Daily Limit: ${status.requests.limit_day}`);
      console.log(`   Used Today: ${status.requests.current}`);
      console.log(`   Remaining: ${status.requests.limit_day - status.requests.current}`);
      console.log(`   Account: ${status.account.firstname} ${status.account.lastname}`);
      console.log(`   Subscription End: ${status.subscription.end}`);
      
      return status;
    }
  } catch (error) {
    console.error('❌ Failed to get API usage:', error.message);
  }
  
  return null;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 F-Bet Data Check Report\n');
  console.log('=' * 50);
  
  try {
    // Check API usage first
    await getAPIUsage();
    console.log('\n' + '=' * 50 + '\n');
    
    // Test API connection
    const apiWorking = await testAPIConnection();
    console.log('\n' + '=' * 50 + '\n');
    
    // Check all tables
    const tableResults = await checkAllTables();
    console.log('=' * 50 + '\n');
    
    // Summary
    const tablesWithData = Object.values(tableResults).filter(r => r.count > 0).length;
    const totalTables = Object.keys(tableResults).length;
    
    console.log('📋 SUMMARY:');
    console.log(`   API Connection: ${apiWorking ? '✅ Working' : '❌ Failed'}`);
    console.log(`   Tables with Data: ${tablesWithData}/${totalTables}`);
    console.log(`   Total Records: ${Object.values(tableResults).reduce((sum, r) => sum + r.count, 0)}`);
    
    if (tablesWithData === 0) {
      console.log('\n⚠️  NO DATA FOUND IN ANY TABLE!');
      console.log('📋 Next steps:');
      console.log('   1. Make sure tables are created: npm run db:create');
      console.log('   2. Sync data from API: npm run db:sync');
    } else if (tablesWithData < totalTables) {
      console.log('\n⚠️  SOME TABLES ARE EMPTY!');
      console.log('📋 Consider running: npm run db:sync');
    } else {
      console.log('\n🎉 ALL TABLES HAVE DATA!');
    }
    
    return tablesWithData > 0;
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    return false;
  }
}

// Run the check
main()
  .then((hasData) => {
    process.exit(hasData ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
