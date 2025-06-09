// Load environment variables first
import 'dotenv/config';

// @ts-ignore
require('module-alias/register');

import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './invoice-routes';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import cors from "cors";
import path from 'path';
import { testConnection } from './db';

// Log environment variables (without sensitive data)
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  PORT: process.env.PORT || 8080
});

const app = express();

// Enable CORS for the client
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const db = drizzle(pool, { schema });

// Test database connection
pool.connect()
  .then(() => console.log('Database connection established successfully'))
  .catch(err => console.error('Error connecting to database:', err));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  // Test database connection before starting the server
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('Failed to connect to the database. Please check your DATABASE_URL in .env file');
    process.exit(1);
  }

  const server = await registerRoutes(app);

  // Serve static files from the client build
  const clientBuildPath = path.resolve(__dirname, '../client');

  app.use(express.static(clientBuildPath));

  // For any route not handled by your API, serve index.html (for React Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({ message });
    throw err;
  });

  const port = process.env.PORT || 8080;
  server.listen({
    port,
    host: '0.0.0.0',
    reusePort: false,
  })
  .on('listening', () => {
    console.log(`Server successfully started on port ${port}`);
  })
  .on('error', (err) => {
    console.error('Error starting server:', err);
    console.log(err); // log the error object to co
  });
})();
