# CLAUDE.md

Welcome to this Express.js + TypeScript + PostgreSQL + DrizzleORM API project. This document outlines contribution guidelines, usage instructions, and development environment setup.

---

# 🗂 Project Structure

api/
├── app/
│ ├── controllers/ # Route handler logic
│ ├── routes/ # Express route definitions
│ ├── utils/ # Helper functions and shared logic
│ └── index.ts # Main app entry point
├── drizzle/ # Drizzle ORM config and migrations
├── .env # Environment variables
├── package.json
├── tsconfig.json
└── CLAUDE.md

---

# Development Setup

## 1. Prerequisites

- Node.js >= 22
- Typescript
- PostgreSQL >= 17
- `drizzle-kit` CLI
- pnpm

## App Structure Details

`app/controllers/`
Contains route handler functions. Controllers should be:
Focused on business logic
Decoupled from Express request/response (for testability)
Return plain objects or throw typed errors
Example:

```ts
// app/controllers/userController.ts
export const getUsers = async () => {
    try {
        return await db.select().from(users);
    }catch(e){
        // log error
        console.log(e)
        return []
    }
};
```

`app/routes/`
Defines and binds HTTP routes to controller logic. Should be minimal.

Example:

```ts
// app/routes/userRoutes.ts
import { Router } from "express";
import \* as userController from "../controllers/userController";

const router = Router();

router.get("/", async (req, res, next) => {
try {
const data = await userController.getUsers();
res.json(data);
} catch (err) {
next(err);
}
});
export default router;
```

`app/utils/`
Utility functions like validation, formatting, or shared constants.

`index.ts`
Entry point for the Express server. Loads middlewares, routes, and starts listening.

Example:

```ts
// app/index.ts
import express from "express";
import userRoutes from "./routes/userRoutes";
import { errorHandler } from "./utils/errorHandler";

const app = express();

app.use(express.json());
app.use("/users", userRoutes);
app.use(errorHandler);

export default app;
```

`server.ts`

Create a server.ts at project root to start the app:

```ts
import app from "./app/index";
import { config } from "dotenv";

config();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log(`🚀 Server listening on port ${PORT}`);
});
```

## Database (Drizzle ORM + PostgreSQL)
Schema lives in drizzle/schema.ts

Configure with drizzle.config.ts

Migrations are auto-generated

```bash
pnpm drizzle:generate
pnpm drizzle:push
```