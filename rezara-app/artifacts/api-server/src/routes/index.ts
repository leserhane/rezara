import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import businessesRouter from "./businesses";
import reservationsRouter from "./reservations";
import paymentsRouter from "./payments";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import capacityRouter from "./capacity";
import storageRouter from "./storage";
import configRouter from "./config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(configRouter);
router.use(businessesRouter);
router.use(reservationsRouter);
router.use(paymentsRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(capacityRouter);
router.use(storageRouter);

export default router;
