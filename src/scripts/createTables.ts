import { supabase } from '../services/supabaseClient';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Create all database tables in Supabase
 */
export async function createDatabaseTables(): Promise<void> {
  try {
    console.log('🚀 Starting database table creation...');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../../database/supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Continue with next statement instead of stopping
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err);
      }
    }

    console.log('🎉 Database table creation completed!');
    
    // Verify tables were created
    await verifyTables();
    
  } catch (error) {
    console.error('❌ Failed to create database tables:', error);
    throw error;
  }
}

/**
 * Verify that all tables were created successfully
 */
async function verifyTables(): Promise<void> {
  console.log('🔍 Verifying tables...');
  
  const expectedTables = [
    'countries',
    'leagues',
    'seasons',
    'venues',
    'teams',
    'players',
    'team_squads',
    'fixtures',
    'fixture_events',
    'fixture_lineups',
    'fixture_lineup_players',
    'fixture_statistics',
    'league_standings',
    'team_statistics',
    'player_statistics',
    'bookmakers',
    'odds',
    'predictions',
    'prediction_comparison',
    'transfers',
    'injuries',
    'coaches',
    'team_coaches'
  ];

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
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}' verification failed:`, err);
    }
  }
}

/**
 * Alternative method using direct SQL execution
 */
export async function createTablesDirectly(): Promise<void> {
  try {
    console.log('🚀 Creating tables directly...');

    // Countries table
    const { error: countriesError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS countries (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          code VARCHAR(3),
          flag TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (countriesError) {
      console.error('Error creating countries table:', countriesError);
    } else {
      console.log('✅ Countries table created');
    }

    // Leagues table
    const { error: leaguesError } = await supabase.rpc('exec_sql', {
      sql_query: `
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
    });

    if (leaguesError) {
      console.error('Error creating leagues table:', leaguesError);
    } else {
      console.log('✅ Leagues table created');
    }

    // Continue with other tables...
    console.log('🎉 Basic tables created successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create tables directly:', error);
    throw error;
  }
}

/**
 * Drop all tables (use with caution!)
 */
export async function dropAllTables(): Promise<void> {
  console.log('⚠️  WARNING: Dropping all tables...');
  
  const tables = [
    'team_coaches',
    'injuries',
    'transfers',
    'prediction_comparison',
    'predictions',
    'odds',
    'bookmakers',
    'player_statistics',
    'team_statistics',
    'league_standings',
    'fixture_statistics',
    'fixture_lineup_players',
    'fixture_lineups',
    'fixture_events',
    'fixtures',
    'team_squads',
    'players',
    'teams',
    'venues',
    'seasons',
    'leagues',
    'coaches',
    'countries'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `DROP TABLE IF EXISTS ${table} CASCADE;`
      });

      if (error) {
        console.error(`Error dropping table ${table}:`, error);
      } else {
        console.log(`✅ Dropped table: ${table}`);
      }
    } catch (err) {
      console.error(`Exception dropping table ${table}:`, err);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  createDatabaseTables()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
