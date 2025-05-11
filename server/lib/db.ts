import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config'
import * as schema from '@shared/schema';

// Initialize connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add SSL configuration for Supabase
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize drizzle with the pool and schema
export const db = drizzle(pool, { schema });

// Test the connection
pool.connect()
  .then(() => console.log('Database connection established successfully'))
  .catch(err => console.error('Error connecting to database:', err));