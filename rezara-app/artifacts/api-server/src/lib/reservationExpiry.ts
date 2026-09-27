import type { reservationsTable } from "@workspace/db/schema";

type ReservationRow = typeof reservationsTable.$inferSelect;

/**
 * How long an unpaid payment link stays valid. Counted from the reservation's
 * last update, so re-activating an expired reservation (or editing a pending
 * one) gives the customer a fresh window.
 *
 * Configurable via RESERVATION_EXPIRY_MINUTES; defaults to the 15 minutes the
 * product was designed around.
 */
export const RESERVATION_EXPIRY_MINUTES = (() => {
  const raw = Number(process.env.RESERVATION_EXPIRY_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : 15;
})();

export function reservationExpiresAt(r: Pick<ReservationRow, "status" | "updatedAt">): string | null {
  if (r.status !== "pending_payment") return null;
  return new Date(r.updatedAt.getTime() + RESERVATION_EXPIRY_MINUTES * 60 * 1000).toISOString();
}

export function serializeReservation(r: ReservationRow) {
  return {
    ...r,
    depositAmount: Number(r.depositAmount),
    expiresAt: reservationExpiresAt(r),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
