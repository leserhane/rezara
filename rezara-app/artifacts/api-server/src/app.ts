import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

const app: Express = express();

// The app runs behind Replit's reverse proxy. Without this, req.ip is the
// proxy's address, so the rate limiter below lumps *every* visitor into one
// bucket and a handful of busy users lock everyone else out.
app.set("trust proxy", 1);

const ALLOWED_ORIGIN_RE =
  /^https?:\/\/(localhost(:\d+)?|.*\.replit\.app|.*\.repl\.co|.*\.replit\.dev|.*\.janeway\.replit\.dev)$/;

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGIN_RE.test(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Tighter limit for the OTP endpoints only — /api/auth/user is called on
// every page load and must not share this budget.
app.use(
  ["/api/auth/send-otp", "/api/auth/verify-otp"],
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many sign-in attempts, please try again later." },
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    // The dashboard polls notifications every 30s and each screen makes a few
    // requests, so 200/15min was reachable by a single busy staff member.
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  }),
);

app.use(cookieParser());
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(authMiddleware);

app.use("/api", router);

export default app;
