import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessesTable, reservationsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { CreateReservationBody, UpdateReservationBody, GetReservationsQueryParams } from "@workspace/api-zod";
import { nanoid } from "nanoid";
import { serializeReservation } from "../lib/reservationExpiry";

const router: IRouter = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Returns a user-facing error for invalid reservation fields, or null. */
function validateReservationFields(data: {
  date?: string;
  time?: string;
  guests?: number;
  depositAmount?: number;
}): string | null {
  if (data.date !== undefined && !DATE_RE.test(data.date)) return "Date must be in YYYY-MM-DD format";
  if (data.time !== undefined && !TIME_RE.test(data.time)) return "Time must be in HH:MM format";
  if (data.guests !== undefined && (!Number.isInteger(data.guests) || data.guests < 1)) {
    return "Guests must be at least 1";
  }
  if (data.depositAmount !== undefined && !(data.depositAmount > 0)) return "Deposit must be greater than 0";
  return null;
}

async function getBusinessByUserId(userId: string) {
  return db.query.businessesTable.findFirst({
    where: eq(businessesTable.userId, userId),
  });
}

router.get("/reservations", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const business = await getBusinessByUserId(req.user.id);
  if (!business) {
    res.status(404).json({ error: "Business profile not found" });
    return;
  }

  const queryParams = GetReservationsQueryParams.safeParse(req.query);
  const status = queryParams.success ? queryParams.data.status : undefined;

  const conditions = [eq(reservationsTable.businessId, business.id)];
  if (status) {
    conditions.push(eq(reservationsTable.status, status));
  }

  const reservations = await db.query.reservationsTable.findMany({
    where: and(...conditions),
    orderBy: [desc(reservationsTable.createdAt)],
  });

  res.json(reservations.map(serializeReservation));
});

router.post("/reservations", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const business = await getBusinessByUserId(req.user.id);
  if (!business) {
    res.status(404).json({ error: "Business profile not found. Please complete your profile first." });
    return;
  }

  if ((business as any).status !== "approved") {
    res.status(403).json({ error: "Your business account is pending admin approval. You cannot create reservations yet." });
    return;
  }

  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const invalid = validateReservationFields(parsed.data);
  if (invalid) {
    res.status(400).json({ error: invalid });
    return;
  }

  // The client pre-generates the link ID so it can open WhatsApp synchronously
  // (popup blockers); only accept URL-safe IDs long enough to be unguessable.
  if (parsed.data.linkId !== undefined && !/^[A-Za-z0-9_-]{10,32}$/.test(parsed.data.linkId)) {
    res.status(400).json({ error: "Invalid link ID" });
    return;
  }

  const linkId = parsed.data.linkId ?? nanoid(10);

  const [reservation] = await db
    .insert(reservationsTable)
    .values({
      businessId: business.id,
      linkId,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone ?? null,
      date: parsed.data.date,
      time: parsed.data.time,
      guests: parsed.data.guests,
      depositAmount: String(parsed.data.depositAmount),
      notes: parsed.data.notes ?? null,
      status: "pending_payment",
    })
    .returning();

  res.status(201).json(serializeReservation(reservation));
});

router.get("/reservations/:reservationId", async (req, res) => {
  const { reservationId } = req.params;

  const reservation = await db.query.reservationsTable.findFirst({
    where: eq(reservationsTable.linkId, reservationId),
    with: { business: true },
  }) as (typeof reservationsTable.$inferSelect & { business: typeof businessesTable.$inferSelect }) | undefined;

  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  // This endpoint is public (anyone holding the link can call it), so only
  // return what the customer's payment page needs: no internal notes, no
  // customer phone, and none of the business's account/approval fields.
  const { business } = reservation;
  res.json({
    ...serializeReservation(reservation),
    customerPhone: null,
    notes: null,
    business: {
      name: business.name,
      logo: business.logo,
      phone: business.phone,
      address: business.address,
      description: business.description,
    },
  });
});

router.put("/reservations/:reservationId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { reservationId } = req.params;

  const business = await getBusinessByUserId(req.user.id);
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  const parsed = UpdateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const invalid = validateReservationFields(parsed.data);
  if (invalid) {
    res.status(400).json({ error: invalid });
    return;
  }

  const existing = await db.query.reservationsTable.findFirst({
    where: and(
      eq(reservationsTable.linkId, reservationId),
      eq(reservationsTable.businessId, business.id)
    ),
  });

  if (!existing) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.customerName !== undefined) updateData.customerName = parsed.data.customerName;
  if (parsed.data.customerPhone !== undefined) updateData.customerPhone = parsed.data.customerPhone;
  if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
  if (parsed.data.time !== undefined) updateData.time = parsed.data.time;
  if (parsed.data.guests !== undefined) updateData.guests = parsed.data.guests;
  if (parsed.data.depositAmount !== undefined) updateData.depositAmount = String(parsed.data.depositAmount);
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  const [updated] = await db
    .update(reservationsTable)
    .set(updateData)
    .where(eq(reservationsTable.id, existing.id))
    .returning();

  res.json(serializeReservation(updated));
});

router.delete("/reservations/:reservationId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { reservationId } = req.params;

  const business = await getBusinessByUserId(req.user.id);
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  const existing = await db.query.reservationsTable.findFirst({
    where: and(
      eq(reservationsTable.linkId, reservationId),
      eq(reservationsTable.businessId, business.id)
    ),
  });

  if (!existing) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const [updated] = await db
    .update(reservationsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(reservationsTable.id, existing.id))
    .returning();

  res.json(serializeReservation(updated));
});

router.post("/reservations/:reservationId/complete", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { reservationId } = req.params;

  const business = await getBusinessByUserId(req.user.id);
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  const existing = await db.query.reservationsTable.findFirst({
    where: and(
      eq(reservationsTable.linkId, reservationId),
      eq(reservationsTable.businessId, business.id)
    ),
  });

  if (!existing) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const [updated] = await db
    .update(reservationsTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(reservationsTable.id, existing.id))
    .returning();

  res.json(serializeReservation(updated));
});

const validStatuses = ["pending_payment", "confirmed", "cancelled", "completed", "expired"] as const;
type ValidStatus = typeof validStatuses[number];

router.patch("/reservations/:reservationId/status", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { reservationId } = req.params;
  const { status } = req.body as { status?: string };

  if (!status || !validStatuses.includes(status as ValidStatus)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    return;
  }

  const business = await getBusinessByUserId(req.user.id);
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  const existing = await db.query.reservationsTable.findFirst({
    where: and(
      eq(reservationsTable.linkId, reservationId),
      eq(reservationsTable.businessId, business.id)
    ),
  });

  if (!existing) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const [updated] = await db
    .update(reservationsTable)
    .set({ status: status as ValidStatus, updatedAt: new Date() })
    .where(eq(reservationsTable.id, existing.id))
    .returning();

  res.json(serializeReservation(updated));
});

export default router;
