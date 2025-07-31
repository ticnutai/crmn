import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { storage } from "./storage";

const app = express();
// Increase payload size limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

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

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Setup basic users will be handled in registerRoutes

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Serve static files in production
    if (process.env.NODE_ENV === "production") {
      app.use(express.static("dist"));
    }

    // Run the server on the specified port
    // Default port for API server: 5201
    const port = parseInt(process.env.PORT || '5201', 10);
    const host = process.env.HOST || 'localhost';
    server.listen(port, host, async () => {
      console.log(`🚀 Server running on http://${host}:${port}`);
      console.log(`🌱 יוצר משתמשים בסיסיים...`);
      await storage.ensureBasicUsers();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();