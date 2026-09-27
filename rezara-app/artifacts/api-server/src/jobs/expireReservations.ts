import { db } from "@workspace/db";
import { reservationsTable } from "@workspace/db/schema";
import { and, eq, lt } from "drizzle-orm";

const EXPIRY_MINUTES = 15;

async function expireOldReservations() {
  try {
    const cutoff = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);

    const expired = await db
      .update(reservationsTable)
      .set({ status: "expired", updatedAt: new Date() })
      .where(
        and(
          eq(reservationsTable.status, "pending_payment"),
          lt(reservationsTable.createdAt, cutoff)
        )
      )
      .returning({ id: reservationsTable.id });

    if (expired.length > 0) {
      console.log(`[jobs] Expired ${expired.length} reservation(s) older than ${EXPIRY_MINUTES} minutes.`);
    }
  } catch (err) {
    console.error("[jobs] Error expiring reservations:", err);
  }
}

export function startExpirationJob() {
  expireOldReservations();
  setInterval(expireOldReservations, 60 * 1000);
  console.log(`[jobs] Reservation expiration job started (${EXPIRY_MINUTES}min threshold, checks every 60s).`);
}
