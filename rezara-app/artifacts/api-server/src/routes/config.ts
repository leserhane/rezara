import { Router, type IRouter, type Request, type Response } from "express";

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

  res.json({ publicBaseUrl });
});

export default router;
