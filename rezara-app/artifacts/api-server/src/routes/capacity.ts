import { Router } from "express";
import { db } from "@workspace/db";
import { capacitySlotsTable, businessesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/capacity", async (req, res) => {
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

  const { date } = req.query;

  const slots = await db.query.capacitySlotsTable.findMany({
    where: date
      ? and(
          eq(capacitySlotsTable.businessId, business.id),
          eq(capacitySlotsTable.date, date as string)
        )
      : eq(capacitySlotsTable.businessId, business.id),
    orderBy: (t, { asc }) => [asc(t.date), asc(t.startTime)],
  });

  res.json(slots);
});

router.post("/capacity", async (req, res) => {
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

  const { date, startTime, durationHours, maxCapacity, id } = req.body;

  if (!date || !maxCapacity) {
    res.status(400).json({ error: "date and maxCapacity are required" });
    return;
  }

  if (id) {
    const existing = await db.query.capacitySlotsTable.findFirst({
      where: and(
        eq(capacitySlotsTable.id, id),
        eq(capacitySlotsTable.businessId, business.id)
      ),
    });

    if (!existing) {
      res.status(404).json({ error: "Capacity slot not found" });
      return;
    }

    const [updated] = await db
      .update(capacitySlotsTable)
      .set({
        date,
        startTime: startTime || null,
        durationHours: durationHours || null,
        maxCapacity: Number(maxCapacity),
        updatedAt: new Date(),
      })
      .where(eq(capacitySlotsTable.id, id))
      .returning();

    res.json(updated);
    return;
  }

  const [slot] = await db
    .insert(capacitySlotsTable)
    .values({
      businessId: business.id,
      date,
      startTime: startTime || null,
      durationHours: durationHours || null,
      maxCapacity: Number(maxCapacity),
    })
    .returning();

  res.json(slot);
});

router.delete("/capacity/:id", async (req, res) => {
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

  const slotId = Number(req.params.id);

  const existing = await db.query.capacitySlotsTable.findFirst({
    where: and(
      eq(capacitySlotsTable.id, slotId),
      eq(capacitySlotsTable.businessId, business.id)
    ),
  });

  if (!existing) {
    res.status(404).json({ error: "Capacity slot not found" });
    return;
  }

  await db
    .delete(capacitySlotsTable)
    .where(eq(capacitySlotsTable.id, slotId));

  res.json({ success: true });
});

export default router;
