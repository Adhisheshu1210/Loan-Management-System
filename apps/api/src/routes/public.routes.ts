import { Router } from "express";
import { landing, landingQuerySchema, submitLandingQuery } from "../controllers/public.controller.js";
import { validate } from "../middlewares/validate.middleware.js";

export const publicRouter = Router();

publicRouter.get("/landing", landing);
publicRouter.post("/query", validate(landingQuerySchema), submitLandingQuery);
