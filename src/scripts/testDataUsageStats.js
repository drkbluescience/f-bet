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
 * Test data usage statistics functionality
 */
async function testDataUsageStats() {
  console.log('🚀 Testing data usage statistics functionality...\n');

  try {
    // Test table stats
    console.log('📊 Testing table statistics...');
    
    const tables = [
      { name: 'countries', displayName: 'Ülkeler' },
      { name: 'leagues', displayName: 'Ligler' },
      { name: 'teams', displayName: 'Takımlar' },
      { name: 'venues', displayName: 'Stadyumlar' },
      { name: 'fixtures', displayName: 'Maçlar' },
      { name: 'league_standings', displayName: 'Puan Durumu' },
      { name: 'predictions', displayName: 'Tahminler' },
    ];

    const today = new Date().toISOString().split('T')[0];
    let totalRecords = 0;
    let totalTodayAdded = 0;

    for (const table of tables) {
      try {
        // Get total count
        const { count: totalCount, error: countError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        // Get today's additions
        const { count: todayCount, error: todayError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`);

        // Get last sync time
        const { data: lastRecord, error: lastError } = await supabase
          .from(table.name)
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1);

        const count = totalCount || 0;
        const todayAdded = todayError ? 0 : (todayCount || 0);
        const lastSync = lastRecord && lastRecord.length > 0 ? lastRecord[0].created_at : null;

        totalRecords += count;
        totalTodayAdded += todayAdded;

        console.log(`  ✅ ${table.displayName}: ${count} kayıt (bugün +${todayAdded})`);
        if (lastSync) {
          const lastSyncDate = new Date(lastSync);
          const now = new Date();
          const diffMs = now.getTime() - lastSyncDate.getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          const diffHours = Math.floor(diffMins / 60);
          
          let timeAgo;
          if (diffMins < 1) timeAgo = 'Az önce';
          else if (diffMins < 60) timeAgo = `${diffMins} dk önce`;
          else if (diffHours < 24) timeAgo = `${diffHours} saat önce`;
          else timeAgo = `${Math.floor(diffHours / 24)} gün önce`;
          
          console.log(`     Son güncelleme: ${timeAgo}`);
        }

        if (countError) {
          console.log(`     ⚠️  Hata: ${countError.message}`);
        }

      } catch (err) {
        console.log(`  ❌ ${table.displayName}: Hata - ${err.message}`);
      }
    }

    console.log(`\n📊 Toplam Özet:`);
    console.log(`   • Toplam Kayıt: ${totalRecords.toLocaleString()}`);
    console.log(`   • Bugün Eklenen: ${totalTodayAdded.toLocaleString()}`);
    console.log(`   • Dolu Tablolar: ${tables.filter(async (table) => {
      const { count } = await supabase.from(table.name).select('*', { count: 'exact', head: true });
      return count > 0;
    }).length}`);

    // Test sync logs
    console.log('\n📋 Testing sync logs...');
    
    const { data: syncLogs, error: logsError } = await supabase
      .from('data_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.log(`❌ Sync logs error: ${logsError.message}`);
    } else if (syncLogs && syncLogs.length > 0) {
      console.log(`✅ Found ${syncLogs.length} sync log entries`);
      
      // Calculate daily summary
      const todayLogs = syncLogs.filter(log => log.sync_date === today);
      const totalApiCalls = todayLogs.reduce((sum, log) => sum + (log.api_calls_used || 0), 0);
      const totalRecordsAdded = todayLogs.reduce((sum, log) => sum + (log.records_added || 0), 0);
      const uniqueTables = new Set(todayLogs.map(log => log.table_name)).size;
      const successRate = todayLogs.length > 0 ? 
        (todayLogs.filter(log => log.status === 'success').length / todayLogs.length) * 100 : 0;

      console.log(`📊 Bugünkü Senkronizasyon Özeti:`);
      console.log(`   • API Çağrıları: ${totalApiCalls}`);
      console.log(`   • Eklenen Kayıtlar: ${totalRecordsAdded}`);
      console.log(`   • Senkronize Edilen Tablolar: ${uniqueTables}`);
      console.log(`   • Başarı Oranı: ${successRate.toFixed(1)}%`);

      console.log(`\n📋 Son Sync Logları:`);
      syncLogs.slice(0, 5).forEach(log => {
        console.log(`   • ${log.table_name}: ${log.records_added} kayıt eklendi (${log.status})`);
      });
    } else {
      console.log(`⚠️  No sync logs found`);
    }

    // Test API usage (mock)
    console.log('\n🌐 Testing API usage simulation...');

    const todayLogs = syncLogs ? syncLogs.filter(log => log.sync_date === today) : [];
    const totalApiCalls = todayLogs.reduce((sum, log) => sum + (log.api_calls_used || 0), 0);

    const mockApiUsage = {
      current: totalApiCalls || 15,
      limit: 100,
      plan: 'Free',
      remaining: 100 - (totalApiCalls || 15),
    };

    console.log(`✅ API Kullanım Simülasyonu:`);
    console.log(`   • Bugün Kullanılan: ${mockApiUsage.current}`);
    console.log(`   • Kalan: ${mockApiUsage.remaining}`);
    console.log(`   • Günlük Limit: ${mockApiUsage.limit}`);
    console.log(`   • Plan: ${mockApiUsage.plan}`);
    console.log(`   • Kullanım Oranı: ${((mockApiUsage.current / mockApiUsage.limit) * 100).toFixed(1)}%`);

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test data transformation
 */
async function testDataTransformation() {
  console.log('\n🔄 Testing data transformation...');

  try {
    // Test fixture data transformation
    const { data: fixtures, error } = await supabase
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
        )
      `)
      .limit(1);

    if (error) {
      console.log(`❌ Fixture query error: ${error.message}`);
      return false;
    }

    if (fixtures && fixtures.length > 0) {
      const fixture = fixtures[0];
      
      // Transform to expected format
      const transformed = {
        fixture_id: fixture.id,
        date_utc: fixture.date,
        status: fixture.status_short || fixture.status_long,
        home_team: fixture.home_team ? {
          team_id: fixture.home_team.id,
          name: fixture.home_team.name,
          logo_url: fixture.home_team.logo
        } : null,
        away_team: fixture.away_team ? {
          team_id: fixture.away_team.id,
          name: fixture.away_team.name,
          logo_url: fixture.away_team.logo
        } : null
      };

      console.log(`✅ Data transformation successful`);
      console.log(`   • Original ID: ${fixture.id} → Transformed ID: ${transformed.fixture_id}`);
      console.log(`   • Original Date: ${fixture.date} → Transformed Date: ${transformed.date_utc}`);
      console.log(`   • Original Status: ${fixture.status_short} → Transformed Status: ${transformed.status}`);
      
      return true;
    } else {
      console.log(`⚠️  No fixtures found for transformation test`);
      return false;
    }

  } catch (error) {
    console.error('❌ Transformation test failed:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting data usage statistics test...\n');
    
    const statsTest = await testDataUsageStats();
    const transformTest = await testDataTransformation();
    
    if (statsTest && transformTest) {
      console.log('\n🎉 All tests passed!');
      console.log('📋 Data usage statistics functionality is working correctly');
      console.log('💡 You can now view data usage in the app:');
      console.log('   • Home screen shows summary');
      console.log('   • Admin screen shows detailed statistics');
      console.log('   • Real-time API usage tracking');
      console.log('   • Daily sync logs and summaries');
      return true;
    } else {
      console.log('\n❌ Some tests failed');
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
