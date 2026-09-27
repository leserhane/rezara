import { Router, type IRouter } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { businessesTable, paymentsTable, reservationsTable, revenueSettlementsTable, usersTable, otpCodesTable } from "@workspace/db/schema";
import { desc, eq, gt, and, sql } from "drizzle-orm";
import { z } from "zod";
import { normalizePhone } from "./auth";

const router: IRouter = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

router.get("/admin/revenue", requireAdmin, async (req, res) => {
  const businesses = await db.query.businessesTable.findMany({
    orderBy: [desc(businessesTable.createdAt)],
  });

  const results = await Promise.all(
    businesses.map(async (business) => {
      const [lastSettlement] = await db
        .select()
        .from(revenueSettlementsTable)
        .where(eq(revenueSettlementsTable.businessId, business.id))
        .orderBy(desc(revenueSettlementsTable.createdAt))
        .limit(1);

      const sinceDate = lastSettlement ? lastSettlement.createdAt : null;

      const confirmedConditions = [
        eq(paymentsTable.businessId, business.id),
        eq(paymentsTable.paymentStatus, "paid"),
      ];
      if (sinceDate) {
        confirmedConditions.push(gt(paymentsTable.createdAt, sinceDate));
      }

      const [unsettledResult] = await db
        .select({ total: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)` })
        .from(paymentsTable)
        .where(and(...confirmedConditions));

      const [totalResult] = await db
        .select({ total: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)` })
        .from(paymentsTable)
        .where(
          and(
            eq(paymentsTable.businessId, business.id),
            eq(paymentsTable.paymentStatus, "paid"),
          )
        );

      const allSettlements = await db
        .select()
        .from(revenueSettlementsTable)
        .where(eq(revenueSettlementsTable.businessId, business.id))
        .orderBy(desc(revenueSettlementsTable.createdAt));

      return {
        id: business.id,
        name: business.name,
        logo: business.logo,
        phone: business.phone,
        createdAt: business.createdAt.toISOString(),
        totalRevenue: Number(totalResult.total),
        unsettledRevenue: Number(unsettledResult.total),
        lastSettlement: lastSettlement
          ? {
              id: lastSettlement.id,
              settledAmount: Number(lastSettlement.settledAmount),
              evidenceUrl: lastSettlement.evidenceUrl,
              notes: lastSettlement.notes,
              settledBy: lastSettlement.settledBy,
              createdAt: lastSettlement.createdAt.toISOString(),
            }
          : null,
        settlementCount: allSettlements.length,
        settlements: allSettlements.map((s) => ({
          id: s.id,
          settledAmount: Number(s.settledAmount),
          evidenceUrl: s.evidenceUrl,
          notes: s.notes,
          settledBy: s.settledBy,
          createdAt: s.createdAt.toISOString(),
        })),
      };
    })
  );

  res.json(results);
});

const SettleRevenueBody = z.object({
  evidenceUrl: z.string().min(1),
  notes: z.string().optional(),
});

router.post("/admin/revenue/:businessId/settle", requireAdmin, async (req, res) => {
  const businessId = Number(req.params.businessId);
  if (isNaN(businessId)) {
    res.status(400).json({ error: "Invalid business ID" });
    return;
  }

  const parsed = SettleRevenueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "evidenceUrl is required" });
    return;
  }

  const [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  const [lastSettlement] = await db
    .select()
    .from(revenueSettlementsTable)
    .where(eq(revenueSettlementsTable.businessId, businessId))
    .orderBy(desc(revenueSettlementsTable.createdAt))
    .limit(1);

  const sinceDate = lastSettlement ? lastSettlement.createdAt : null;

  const conditions = [
    eq(paymentsTable.businessId, businessId),
    eq(paymentsTable.paymentStatus, "paid"),
  ];
  if (sinceDate) {
    conditions.push(gt(paymentsTable.createdAt, sinceDate));
  }

  const [result] = await db
    .select({ total: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)` })
    .from(paymentsTable)
    .where(and(...conditions));

  const settledAmount = Number(result.total);

  const [settlement] = await db
    .insert(revenueSettlementsTable)
    .values({
      businessId,
      settledAmount: String(settledAmount),
      evidenceUrl: parsed.data.evidenceUrl,
      notes: parsed.data.notes,
      settledBy: req.user?.id ?? "admin",
    })
    .returning();

  res.json({
    success: true,
    settlement: {
      ...settlement,
      settledAmount: Number(settlement.settledAmount),
      createdAt: settlement.createdAt.toISOString(),
    },
  });
});

router.get("/admin/businesses", requireAdmin, async (req, res) => {
  const businesses = await db.query.businessesTable.findMany({
    orderBy: [desc(businessesTable.createdAt)],
  });

  const results = await Promise.all(
    businesses.map(async (b) => {
      const [owner] = await db
        .select({ phone: usersTable.phone, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, b.userId))
        .limit(1);

      return {
        ...b,
        ownerPhone: owner?.phone ?? owner?.email ?? null,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      };
    })
  );

  res.json(results);
});

const UpdateBusinessBody = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  logo: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

router.patch("/admin/businesses/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateBusinessBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [updated] = await db
    .update(businessesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(businessesTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Business not found" }); return; }

  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
});

const UpdateBusinessStatusBody = z.object({
  status: z.enum(["approved", "rejected", "pending"]),
  statusNote: z.string().optional(),
});

router.patch("/admin/businesses/:id/status", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateBusinessStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [updated] = await db
    .update(businessesTable)
    .set({ status: parsed.data.status, statusNote: parsed.data.statusNote ?? null, updatedAt: new Date() })
    .where(eq(businessesTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Business not found" }); return; }

  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
});

router.post("/admin/businesses/:id/generate-otp", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, id)).limit(1);
  if (!business) { res.status(404).json({ error: "Business not found" }); return; }

  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, business.userId)).limit(1);
  if (!owner) { res.status(404).json({ error: "Owner not found" }); return; }

  const phone = owner.phone ?? owner.email;
  if (!phone) { res.status(400).json({ error: "Owner has no phone registered" }); return; }

  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Store under the canonical form: that is what /auth/verify-otp looks up.
  await db.insert(otpCodesTable).values({ phone: normalizePhone(phone), code, expiresAt });

  res.json({ success: true, phone, otpCode: code, expiresIn: "15 minutes" });
});

router.get("/admin/reservations", requireAdmin, async (req, res) => {
  const reservations = await db.query.reservationsTable.findMany({
    with: { business: true },
    orderBy: [desc(reservationsTable.createdAt)],
  }) as any[];

  res.json(
    reservations.map((r) => ({
      ...r,
      depositAmount: Number(r.depositAmount),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      business: r.business
        ? {
            ...r.business,
            createdAt: r.business.createdAt.toISOString(),
            updatedAt: r.business.updatedAt.toISOString(),
          }
        : null,
    }))
  );
});

router.get("/admin/payments", requireAdmin, async (req, res) => {
  const payments = await db.query.paymentsTable.findMany({
    with: { reservation: { with: { business: true } } },
    orderBy: [desc(paymentsTable.createdAt)],
  }) as any[];

  res.json(
    payments.map((p) => ({
      id: p.id,
      reservationId: p.reservationId,
      businessId: p.businessId,
      businessName: p.reservation?.business?.name ?? "Unknown",
      customerName: p.reservation?.customerName ?? "Unknown",
      amount: Number(p.amount),
      currency: p.currency,
      paymentStatus: p.paymentStatus,
      stripeSessionId: p.stripeSessionId,
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

export default router;
