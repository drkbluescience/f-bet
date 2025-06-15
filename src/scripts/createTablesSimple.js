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
 * Create tables one by one
 */
async function createTables() {
  console.log('🚀 Creating database tables...');
  
  const tables = [
    {
      name: 'countries',
      sql: `
        CREATE TABLE IF NOT EXISTS countries (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          code VARCHAR(3),
          flag TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'leagues',
      sql: `
        CREATE TABLE IF NOT EXISTS leagues (
          id INTEGER PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          type VARCHAR(50),
          logo TEXT,
          country_id INTEGER REFERENCES countries(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'seasons',
      sql: `
        CREATE TABLE IF NOT EXISTS seasons (
          id SERIAL PRIMARY KEY,
          league_id INTEGER REFERENCES leagues(id),
          year INTEGER NOT NULL,
          start_date DATE,
          end_date DATE,
          current BOOLEAN DEFAULT FALSE,
          coverage JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(league_id, year)
        );
      `
    },
    {
      name: 'venues',
      sql: `
        CREATE TABLE IF NOT EXISTS venues (
          id INTEGER PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          address TEXT,
          city VARCHAR(100),
          country VARCHAR(100),
          capacity INTEGER,
          surface VARCHAR(50),
          image TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'teams',
      sql: `
        CREATE TABLE IF NOT EXISTS teams (
          id INTEGER PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          code VARCHAR(10),
          country VARCHAR(100),
          founded INTEGER,
          national BOOLEAN DEFAULT FALSE,
          logo TEXT,
          venue_id INTEGER REFERENCES venues(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'fixtures',
      sql: `
        CREATE TABLE IF NOT EXISTS fixtures (
          id INTEGER PRIMARY KEY,
          referee VARCHAR(200),
          timezone VARCHAR(50),
          date TIMESTAMP WITH TIME ZONE,
          timestamp BIGINT,
          venue_id INTEGER REFERENCES venues(id),
          status_long VARCHAR(50),
          status_short VARCHAR(10),
          status_elapsed INTEGER,
          league_id INTEGER REFERENCES leagues(id),
          season_year INTEGER,
          round VARCHAR(100),
          home_team_id INTEGER REFERENCES teams(id),
          away_team_id INTEGER REFERENCES teams(id),
          home_goals INTEGER,
          away_goals INTEGER,
          home_goals_halftime INTEGER,
          away_goals_halftime INTEGER,
          home_goals_extratime INTEGER,
          away_goals_extratime INTEGER,
          home_goals_penalty INTEGER,
          away_goals_penalty INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'league_standings',
      sql: `
        CREATE TABLE IF NOT EXISTS league_standings (
          id SERIAL PRIMARY KEY,
          league_id INTEGER REFERENCES leagues(id),
          season_year INTEGER,
          team_id INTEGER REFERENCES teams(id),
          rank INTEGER,
          points INTEGER,
          goalsDiff INTEGER,
          group_name VARCHAR(50),
          form VARCHAR(10),
          status VARCHAR(50),
          description TEXT,
          played INTEGER,
          win INTEGER,
          draw INTEGER,
          lose INTEGER,
          goals_for INTEGER,
          goals_against INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(league_id, season_year, team_id)
        );
      `
    },
    {
      name: 'predictions',
      sql: `
        CREATE TABLE IF NOT EXISTS predictions (
          id SERIAL PRIMARY KEY,
          fixture_id INTEGER REFERENCES fixtures(id),
          winner_id INTEGER REFERENCES teams(id),
          winner_comment TEXT,
          win_or_draw BOOLEAN,
          under_over VARCHAR(10),
          goals_home VARCHAR(10),
          goals_away VARCHAR(10),
          advice TEXT,
          percent_home INTEGER,
          percent_draw INTEGER,
          percent_away INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(fixture_id)
        );
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const table of tables) {
    try {
      console.log(`📝 Creating table: ${table.name}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: table.sql
      });

      if (error) {
        console.log(`❌ Failed to create table ${table.name}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Table ${table.name} created successfully`);
        successCount++;
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.error(`❌ Exception creating table ${table.name}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} tables created, ${errorCount} errors`);
  
  if (successCount > 0) {
    console.log('✅ Database tables created successfully!');
    return true;
  } else {
    console.log('❌ Failed to create database tables');
    return false;
  }
}

/**
 * Create indexes for better performance
 */
async function createIndexes() {
  console.log('🔧 Creating indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_fixtures_date ON fixtures(date);',
    'CREATE INDEX IF NOT EXISTS idx_fixtures_league_season ON fixtures(league_id, season_year);',
    'CREATE INDEX IF NOT EXISTS idx_fixtures_teams ON fixtures(home_team_id, away_team_id);',
    'CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status_short);',
    'CREATE INDEX IF NOT EXISTS idx_league_standings_league_season ON league_standings(league_id, season_year);',
    'CREATE INDEX IF NOT EXISTS idx_predictions_fixture ON predictions(fixture_id);'
  ];

  for (const indexSql of indexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: indexSql
      });

      if (error) {
        console.log(`❌ Failed to create index:`, error.message);
      } else {
        console.log(`✅ Index created successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception creating index:`, err.message);
    }
  }
}

/**
 * Verify tables were created
 */
async function verifyTables() {
  console.log('🔍 Verifying tables...');
  
  const expectedTables = ['countries', 'leagues', 'seasons', 'venues', 'teams', 'fixtures', 'league_standings', 'predictions'];
  let verifiedCount = 0;

  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${tableName}' not accessible:`, error.message);
      } else {
        console.log(`✅ Table '${tableName}' verified`);
        verifiedCount++;
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}' verification failed:`, err.message);
    }
  }

  console.log(`\n📊 Verification: ${verifiedCount}/${expectedTables.length} tables accessible`);
  return verifiedCount === expectedTables.length;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting database setup...\n');
    
    // Create tables
    const tablesCreated = await createTables();
    console.log('');
    
    if (tablesCreated) {
      // Create indexes
      await createIndexes();
      console.log('');
      
      // Verify tables
      const allVerified = await verifyTables();
      console.log('');
      
      if (allVerified) {
        console.log('🎉 Database setup completed successfully!');
        console.log('📋 Next step: Run "npm run db:sync" to populate with data');
        return true;
      }
    }
    
    console.log('❌ Database setup completed with errors');
    return false;
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
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
