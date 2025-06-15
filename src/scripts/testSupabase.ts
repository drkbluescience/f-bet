import { supabase } from '../services/supabaseClient';

/**
 * Test Supabase connection and basic functionality
 */
export async function testSupabaseConnection(): Promise<void> {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Supabase connection test failed:', error.message);
      console.log('📝 This is expected if tables are not created yet');
      
      // Try to create a simple test table
      console.log('🔧 Attempting to create a test table...');
      
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS test_connection (
            id SERIAL PRIMARY KEY,
            message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createError) {
        console.log('❌ Failed to create test table:', createError.message);
        console.log('📋 You need to create the RPC functions first in Supabase SQL Editor');
        console.log('📄 Copy the content from database/rpc-functions.sql to SQL Editor');
      } else {
        console.log('✅ Test table created successfully!');
        
        // Insert test data
        const { error: insertError } = await supabase
          .from('test_connection')
          .insert({ message: 'Connection test successful!' });

        if (insertError) {
          console.log('❌ Failed to insert test data:', insertError.message);
        } else {
          console.log('✅ Test data inserted successfully!');
        }
      }
    } else {
      console.log('✅ Supabase connection successful!');
      console.log(`📊 Found ${data?.length || 0} records in countries table`);
    }
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    throw error;
  }
}

/**
 * Create RPC functions in Supabase
 */
export async function createRPCFunctions(): Promise<void> {
  console.log('🔧 Creating RPC functions...');
  
  try {
    // Create exec_sql function
    const { error: execSqlError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_query;
          RETURN 'SQL executed successfully';
        EXCEPTION
          WHEN OTHERS THEN
            RETURN 'Error: ' || SQLERRM;
        END;
        $$;
      `
    });

    if (execSqlError) {
      console.log('❌ Failed to create exec_sql function:', execSqlError.message);
      console.log('📋 Please create this function manually in Supabase SQL Editor:');
      console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN 'SQL executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;
      `);
    } else {
      console.log('✅ exec_sql function created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Failed to create RPC functions:', error);
    throw error;
  }
}

/**
 * Test API-Football connection
 */
export async function testAPIFootball(): Promise<void> {
  console.log('🌐 Testing API-Football connection...');
  
  const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY;
  
  if (!API_KEY) {
    console.log('❌ API-Football key not found in environment variables');
    return;
  }
  
  try {
    const response = await fetch('https://v3.football.api-sports.io/status', {
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
    
    console.log('✅ API-Football connection successful!');
    console.log('📊 API Status:', data.response);
    
  } catch (error) {
    console.error('❌ API-Football test failed:', error);
    throw error;
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Running all connection tests...\n');
  
  try {
    // Test Supabase
    await testSupabaseConnection();
    console.log('');
    
    // Test API-Football
    await testAPIFootball();
    console.log('');
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Tests failed:', error);
    throw error;
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}
