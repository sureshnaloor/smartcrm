import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './invoice-routes';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import cors from "cors";

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({ message });
    throw err;
  });

  const port = process.env.PORT || 3000;
  server.listen({
    port,
    host: '0.0.0.0',
    reusePort: false,
  })
  .on('listening', () => {
    console.log(`Server successfully started on port ${port}`);
  })
  .on('error', (err) => {
    // console.log(`Server failed to start. Error details:`);
    // console.log(`- Code: ${err.code}`);
    // console.log(`- Message: ${err.message}`);
    // console.log(`- Stack: ${err.stack}`);
    // if (err.code === 'EADDRINUSE') {
    //   console.log(`Port ${port} is already in use`);
    // }
    //  else if (err.code === 'EACCES') {
    //   console.log(`Permission denied for port ${port}`);
    // } 
  
    console.log(err); // log the error object to co
  });
})();
