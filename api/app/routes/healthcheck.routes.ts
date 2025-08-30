import { Router } from "express";
import { getHealthcheck } from "../controllers/healthcheck.controller";

const router: Router = Router();

// DEFAULT ROUTE
router.get("/", getHealthcheck);
// HEALTHCHECK ROUTE
router.get("/healthcheck", getHealthcheck);

export default router;
