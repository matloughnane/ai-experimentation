import express, { type Express } from "express";
import healthcheckRoutes from "./routes/healthcheck.routes";
import mcpRouter from "./mcp";
import cors from "cors";

const app: Express = express();

app.use(express.json());
// ALLOW CORS FROM ALL ORIGINS
app.use(cors(
    {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: "*",
        exposedHeaders: "*",
        credentials: true,
    }
));

// MCP ENDPOINTS
app.use("/mcp", mcpRouter);

// ROUTES
// API ENDPOINTS
app.use("/", healthcheckRoutes);


export default app;
