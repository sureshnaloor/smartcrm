import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';
import * as schema from '@shared/schema';

// Log database connection details (without sensitive data)
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

// Parse connection string to get connection details (without sensitive data)
const connectionDetails = new URL(dbUrl);
console.log('Database connection details:', {
  host: connectionDetails.hostname,
  port: connectionDetails.port,
  database: connectionDetails.pathname.split('/').pop(),
  user: connectionDetails.username,
  ssl: connectionDetails.searchParams.get('sslmode') === 'require'
});

// Initialize connection pool with transaction support
const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

// Enable query logging
pool.on('connect', async (client) => {
  console.log('New client connected to database');
  // Enable query logging
  await client.query('SET log_statement = "all"');
  await client.query('SET log_min_duration_statement = 0');
  // Set default transaction isolation level
  await client.query('SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL READ COMMITTED');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize drizzle with the pool and schema
export const db = drizzle(pool, { 
  schema,
  // Enable query logging
  logger: {
    logQuery(query: string, params: any[]) {
      console.log('Executing query:', query);
      console.log('With params:', params.map(p => p === undefined ? 'undefined' : typeof p === 'string' ? '[REDACTED]' : p));
    }
  }
});

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to database');
    
    // Test query to check if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Available tables:', result.rows.map(row => row.table_name));
    
    // Test transaction support
    await client.query('BEGIN');
    try {
      await client.query('SELECT 1');
      await client.query('COMMIT');
      console.log('Transaction test successful');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('Error testing database connection:', error);
    return false;
  }
} 