import express, { type Express } from "express";
import healthcheckRoutes from "./routes/healthcheck.routes";
import mcpRouter from "./mcp";

const app: Express = express();

app.use(express.json());

// MCP ENDPOINTS
app.use("/mcp", mcpRouter);

// ROUTES
// API ENDPOINTS
app.use("/", healthcheckRoutes);

export default app;
