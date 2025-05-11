import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./invoice-routes";
import { setupVite, serveStatic, log } from "./vite";
import 'dotenv/config'
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 3000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: false, // Changed from true to false
  })
  .on('listening', () => {
    log(`Server successfully started on port ${port}`);
  })
  .on('error', (err) => {
    log(`Server failed to start. Error details:`);
    log(`- Code: ${err.code}`);
    log(`- Message: ${err.message}`);
    log(`- Stack: ${err.stack}`);
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use`);
    } else if (err.code === 'EACCES') {
      log(`Permission denied for port ${port}`);
    } else if (err.code === 'ENOTSUP') {
      log(`Operation not supported on socket. Trying alternative configuration...`);
      // Attempt to start server with different settings
      server.listen(port, '127.0.0.1', () => {
        log(`Server started on localhost:${port}`);
      });
    }
  });
})();
