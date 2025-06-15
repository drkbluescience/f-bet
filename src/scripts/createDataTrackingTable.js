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
 * Create data tracking table
 */
async function createDataTrackingTable() {
  console.log('🚀 Creating data tracking table...\n');

  try {
    console.log('📝 Creating data_sync_logs table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS data_sync_logs (
          id SERIAL PRIMARY KEY,
          table_name VARCHAR(100) NOT NULL,
          sync_date DATE NOT NULL,
          records_added INTEGER DEFAULT 0,
          records_updated INTEGER DEFAULT 0,
          api_calls_used INTEGER DEFAULT 0,
          sync_duration_ms INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'success',
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (error) {
      console.log(`❌ Failed to create table:`, error.message);
      return false;
    } else {
      console.log(`✅ Table data_sync_logs created successfully`);
    }

    // Create indexes
    console.log('📝 Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_data_sync_logs_table_date ON data_sync_logs(table_name, sync_date);',
      'CREATE INDEX IF NOT EXISTS idx_data_sync_logs_date ON data_sync_logs(sync_date);',
      'CREATE INDEX IF NOT EXISTS idx_data_sync_logs_status ON data_sync_logs(status);'
    ];

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql_query: indexSql
      });

      if (indexError) {
        console.log(`❌ Failed to create index:`, indexError.message);
      } else {
        console.log(`✅ Index created successfully`);
      }
    }

    // Verify table
    console.log('\n🔍 Verifying table...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('data_sync_logs')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.log(`❌ Table verification failed:`, verifyError.message);
      return false;
    } else {
      console.log(`✅ Table data_sync_logs verified successfully`);
    }

    return true;

  } catch (err) {
    console.error(`❌ Exception creating table:`, err.message);
    return false;
  }
}

/**
 * Add sample log entries for testing
 */
async function addSampleLogs() {
  console.log('\n📊 Adding sample log entries...');

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];

  const sampleLogs = [
    {
      table_name: 'countries',
      sync_date: today,
      records_added: 49,
      records_updated: 0,
      api_calls_used: 1,
      sync_duration_ms: 2500,
      status: 'success'
    },
    {
      table_name: 'leagues',
      sync_date: today,
      records_added: 100,
      records_updated: 5,
      api_calls_used: 1,
      sync_duration_ms: 3200,
      status: 'success'
    },
    {
      table_name: 'teams',
      sync_date: today,
      records_added: 59,
      records_updated: 2,
      api_calls_used: 3,
      sync_duration_ms: 8500,
      status: 'success'
    },
    {
      table_name: 'fixtures',
      sync_date: today,
      records_added: 4,
      records_updated: 0,
      api_calls_used: 2,
      sync_duration_ms: 4100,
      status: 'success'
    },
    {
      table_name: 'fixtures',
      sync_date: yesterdayString,
      records_added: 15,
      records_updated: 3,
      api_calls_used: 3,
      sync_duration_ms: 5200,
      status: 'success'
    },
    {
      table_name: 'teams',
      sync_date: yesterdayString,
      records_added: 0,
      records_updated: 1,
      api_calls_used: 1,
      sync_duration_ms: 1800,
      status: 'partial'
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const log of sampleLogs) {
    try {
      const { error } = await supabase
        .from('data_sync_logs')
        .insert([log]);

      if (error) {
        console.log(`❌ Failed to add log for ${log.table_name}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Added log for ${log.table_name} (${log.sync_date})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception adding log for ${log.table_name}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Sample logs: ${successCount} added, ${errorCount} errors`);
  return successCount > 0;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting data tracking setup...\n');
    
    // Create table
    const tableCreated = await createDataTrackingTable();
    
    if (tableCreated) {
      // Add sample logs
      const logsAdded = await addSampleLogs();
      
      if (logsAdded) {
        console.log('\n🎉 Data tracking setup completed successfully!');
        console.log('📋 You can now track daily data synchronization statistics');
        return true;
      }
    }
    
    console.log('\n❌ Data tracking setup completed with errors');
    return false;
    
  } catch (error) {
    console.error('❌ Data tracking setup failed:', error.message);
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
