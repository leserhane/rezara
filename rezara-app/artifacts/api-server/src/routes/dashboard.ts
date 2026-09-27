import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessesTable, paymentsTable, reservationsTable } from "@workspace/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const business = await db.query.businessesTable.findFirst({
    where: eq(businessesTable.userId, req.user.id),
  });

  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  const allReservations = await db.query.reservationsTable.findMany({
    where: eq(reservationsTable.businessId, business.id),
    orderBy: [desc(reservationsTable.createdAt)],
  });

  const totalReservations = allReservations.length;
  const pendingPayment = allReservations.filter((r) => r.status === "pending_payment").length;
  const confirmed = allReservations.filter((r) => r.status === "confirmed").length;
  const cancelled = allReservations.filter((r) => r.status === "cancelled").length;
  const completed = allReservations.filter((r) => r.status === "completed").length;

  const paidPayments = await db.query.paymentsTable.findMany({
    where: and(
      eq(paymentsTable.businessId, business.id),
      eq(paymentsTable.paymentStatus, "paid")
    ),
  });

  const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const today = new Date().toISOString().split("T")[0];
  const upcomingReservations = allReservations
    .filter((r) => r.date >= today && (r.status === "confirmed" || r.status === "pending_payment"))
    .slice(0, 5)
    .map((r) => ({
      ...r,
      depositAmount: Number(r.depositAmount),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

  const recentReservations = allReservations.slice(0, 10).map((r) => ({
    ...r,
    depositAmount: Number(r.depositAmount),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  res.json({
    totalReservations,
    pendingPayment,
    confirmed,
    cancelled,
    completed,
    totalRevenue,
    recentReservations,
  });
});

router.get("/notifications", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const business = await db.query.businessesTable.findFirst({
    where: eq(businessesTable.userId, req.user.id),
  });

  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  const payments = await db.query.paymentsTable.findMany({
    where: and(
      eq(paymentsTable.businessId, business.id),
      eq(paymentsTable.paymentStatus, "paid")
    ),
    orderBy: [desc(paymentsTable.createdAt)],
    limit: 20,
    with: { reservation: true },
  });

  const notifications = payments.map((p) => ({
    id: p.id,
    reservationId: p.reservationId,
    customerName: (p as any).reservation?.customerName ?? "Customer",
    amount: Number(p.amount),
    paidAt: p.createdAt.toISOString(),
  }));

  res.json(notifications);
});

export default router;
