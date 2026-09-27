import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { db, usersTable, otpCodesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

const OTP_TTL_MS = 5 * 60 * 1000;

/* ─── In-memory rate limiters ─── */

/** send-otp: max 5 requests per phone per 15 min */
const sendOtpThrottle = new Map<string, { count: number; resetAt: number }>();

/** verify-otp: max 5 wrong attempts per phone per 10 min, then all codes locked */
const verifyFailures = new Map<string, { count: number; resetAt: number }>();

const SEND_MAX = 5;
const SEND_WINDOW_MS = 15 * 60 * 1000;
const VERIFY_MAX = 5;
const VERIFY_WINDOW_MS = 10 * 60 * 1000;

function checkSendLimit(phone: string): boolean {
  const now = Date.now();
  const entry = sendOtpThrottle.get(phone);
  if (!entry || now > entry.resetAt) {
    sendOtpThrottle.set(phone, { count: 1, resetAt: now + SEND_WINDOW_MS });
    return true;
  }
  if (entry.count >= SEND_MAX) return false;
  entry.count += 1;
  return true;
}

function recordVerifyFailure(phone: string): { locked: boolean; remaining: number } {
  const now = Date.now();
  const entry = verifyFailures.get(phone);
  if (!entry || now > entry.resetAt) {
    verifyFailures.set(phone, { count: 1, resetAt: now + VERIFY_WINDOW_MS });
    return { locked: false, remaining: VERIFY_MAX - 1 };
  }
  entry.count += 1;
  const locked = entry.count >= VERIFY_MAX;
  return { locked, remaining: Math.max(0, VERIFY_MAX - entry.count) };
}

function isVerifyLocked(phone: string): boolean {
  const now = Date.now();
  const entry = verifyFailures.get(phone);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= VERIFY_MAX;
}

function clearVerifyFailures(phone: string) {
  verifyFailures.delete(phone);
}

/* ─── Helpers ─── */

const SendOtpBody = z.object({ phone: z.string().min(6).max(20) });
const VerifyOtpBody = z.object({ phone: z.string().min(6).max(20), code: z.string().length(6) });

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

/** Cryptographically secure 6-digit OTP */
function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

function isAdminPhone(phone: string): boolean {
  const adminPhones = (process.env.ADMIN_PHONES ?? "").split(",").map((p) => p.trim());
  return adminPhones.length > 0 && adminPhones[0] !== "" && adminPhones.includes(phone);
}

/* ─── Routes ─── */

router.post("/auth/send-otp", async (req: Request, res: Response) => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }

  const { phone } = parsed.data;

  if (!checkSendLimit(phone)) {
    res.status(429).json({ error: "Too many OTP requests. Please wait before trying again." });
    return;
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Invalidate all previous unused OTPs for this phone so only the latest works
  await db
    .update(otpCodesTable)
    .set({ used: true })
    .where(and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.used, false)));

  await db.insert(otpCodesTable).values({ phone, code, expiresAt });

  const testMode = process.env.OTP_TEST_MODE !== "false";

  res.json({
    success: true,
    ...(testMode ? { otpCode: code } : {}),
  });
});

router.post("/auth/verify-otp", async (req: Request, res: Response) => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { phone, code } = parsed.data;

  if (isVerifyLocked(phone)) {
    res.status(429).json({ error: "Too many failed attempts. Please request a new code." });
    return;
  }

  const now = new Date();

  const [otp] = await db
    .select()
    .from(otpCodesTable)
    .where(
      and(
        eq(otpCodesTable.phone, phone),
        eq(otpCodesTable.code, code),
        eq(otpCodesTable.used, false),
        gt(otpCodesTable.expiresAt, now),
      ),
    )
    .limit(1);

  if (!otp) {
    const { locked, remaining } = recordVerifyFailure(phone);
    if (locked) {
      // Invalidate all active OTPs for this phone after lockout
      await db
        .update(otpCodesTable)
        .set({ used: true })
        .where(and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.used, false)));
      res.status(429).json({ error: "Too many failed attempts. Please request a new code." });
    } else {
      res.status(401).json({ error: "Invalid or expired code", attemptsLeft: remaining });
    }
    return;
  }

  // Mark OTP as consumed
  await db
    .update(otpCodesTable)
    .set({ used: true })
    .where(eq(otpCodesTable.id, otp.id));

  // Clear failed-attempt counter on success
  clearVerifyFailures(phone);

  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone))
    .limit(1);

  let dbUser = existingUser;

  if (!dbUser) {
    const [newUser] = await db
      .insert(usersTable)
      .values({ phone })
      .returning();
    dbUser = newUser;
  }

  const role = isAdminPhone(phone) ? ("admin" as const) : ("user" as const);

  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email ?? phone,
      role,
      firstName: dbUser.firstName ?? undefined,
      lastName: dbUser.lastName ?? undefined,
      profileImage: dbUser.profileImageUrl ?? undefined,
    },
    access_token: "",
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  res.json({ success: true, user: sessionData.user });
});

router.get("/auth/user", (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ user: null });
    return;
  }
  res.json({ user: req.user });
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

export default router;
