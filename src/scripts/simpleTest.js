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
 * Test Supabase connection
 */
async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection by trying to access a table
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Countries table not accessible:', error.message);
      console.log('📝 This is expected if tables are not created yet');
      return false;
    } else {
      console.log('✅ Supabase connection successful!');
      console.log(`📊 Found ${data?.length || 0} records in countries table`);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
    return false;
  }
}

/**
 * Create the exec_sql RPC function
 */
async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql RPC function...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
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

    if (error) {
      console.log('❌ Failed to create exec_sql function:', error.message);
      console.log('📋 Please create this function manually in Supabase SQL Editor');
      return false;
    } else {
      console.log('✅ exec_sql function created successfully!');
      console.log('📄 Response:', data);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Failed to create exec_sql function:', error.message);
    return false;
  }
}

/**
 * Create a simple test table
 */
async function createTestTable() {
  console.log('🔧 Creating test table...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS test_connection (
          id SERIAL PRIMARY KEY,
          message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (error) {
      console.log('❌ Failed to create test table:', error.message);
      return false;
    } else {
      console.log('✅ Test table created successfully!');
      console.log('📄 Response:', data);
      
      // Insert test data
      const { error: insertError } = await supabase
        .from('test_connection')
        .insert({ message: 'Connection test successful!' });

      if (insertError) {
        console.log('❌ Failed to insert test data:', insertError.message);
        return false;
      } else {
        console.log('✅ Test data inserted successfully!');
        return true;
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to create test table:', error.message);
    return false;
  }
}

/**
 * Test API-Football connection
 */
async function testAPIFootball() {
  console.log('🌐 Testing API-Football connection...');
  
  const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || '65ded8ae3bf506066acc2e2343b6eec9';
  
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
    console.log('📊 API Status:', JSON.stringify(data.response, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ API-Football test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Running all connection tests...\n');
  
  let allPassed = true;
  
  try {
    // Test Supabase connection
    const supabaseOk = await testSupabaseConnection();
    console.log('');
    
    // If Supabase connection failed, try to create RPC function
    if (!supabaseOk) {
      console.log('🔧 Attempting to create RPC functions...');
      await createExecSqlFunction();
      console.log('');
      
      // Try to create test table
      await createTestTable();
      console.log('');
    }
    
    // Test API-Football
    const apiOk = await testAPIFootball();
    console.log('');
    
    if (supabaseOk && apiOk) {
      console.log('🎉 All tests passed! Ready to create database tables.');
    } else {
      console.log('⚠️  Some tests failed. Check the errors above.');
      allPassed = false;
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    return false;
  }
}

// Run tests
runAllTests()
  .then((success) => {
    if (success) {
      console.log('✅ Test script completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Test script completed with errors');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
