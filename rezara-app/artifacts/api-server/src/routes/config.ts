import { Router, type IRouter, type Request, type Response } from "express";
import { RESERVATION_EXPIRY_MINUTES } from "../lib/reservationExpiry";

const router: IRouter = Router();

router.get("/config", (_req: Request, res: Response) => {
  const customUrl = process.env.PUBLIC_BASE_URL;
  const replitDomain = process.env.REPLIT_DEV_DOMAIN;

  let publicBaseUrl: string;
  if (customUrl) {
    publicBaseUrl = customUrl.replace(/\/$/, "");
  } else if (replitDomain) {
    publicBaseUrl = `https://${replitDomain}/booking-platform`;
  } else {
    publicBaseUrl = "";
  }

  res.json({ publicBaseUrl, reservationExpiryMinutes: RESERVATION_EXPIRY_MINUTES });
});

export default router;
