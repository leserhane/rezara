import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessesTable, paymentsTable, reservationsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { z as zod } from "zod";

const router: IRouter = Router();

function getPayPalBase() {
  const mode = process.env.PAYPAL_MODE || "sandbox";
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

// PayPal does not support charging in MAD (Moroccan Dirham), but all deposit
// amounts in this app are entered and displayed in MAD. We convert to USD
// for the actual PayPal charge so customers aren't overcharged ~10x by having
// the raw MAD number billed as USD. This rate can be tuned via env var.
const MAD_PER_USD = Number(process.env.MAD_PER_USD) || 10;

function madToUsd(mad: number): string {
  const usd = mad / MAD_PER_USD;
  return Math.max(usd, 0.5).toFixed(2);
}

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set");
  }
  const base = getPayPalBase();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal token error: ${err}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Return the PayPal client ID so the frontend SDK can use it
router.get("/payments/paypal/config", (_req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID || "";
  const mode = process.env.PAYPAL_MODE || "sandbox";
  res.json({ clientId, mode, madPerUsd: MAD_PER_USD });
});

// Create a PayPal order and return the order ID to the PayPal JS SDK
const CreateOrderBody = zod.object({ linkId: zod.string() });

router.post("/payments/paypal/create-order", async (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { linkId } = parsed.data;

  const reservation = await db.query.reservationsTable.findFirst({
    where: eq(reservationsTable.linkId, linkId),
    with: { business: true },
  }) as any;

  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  if (reservation.status !== "pending_payment") {
    res.status(400).json({ error: "This reservation is no longer awaiting payment" });
    return;
  }

  try {
    const token = await getPayPalToken();
    const base = getPayPalBase();

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: madToUsd(Number(reservation.depositAmount)),
            },
            description: `Deposit – ${reservation.business.name} – ${reservation.customerName}`,
            custom_id: linkId,
          },
        ],
        application_context: {
          brand_name: "Rezara",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      console.error("PayPal create-order error:", err);
      res.status(502).json({ error: "Failed to create PayPal order" });
      return;
    }

    const order = (await orderRes.json()) as { id: string };

    await db.insert(paymentsTable).values({
      reservationId: reservation.id,
      businessId: reservation.businessId,
      amount: String(reservation.depositAmount),
      currency: "MAD",
      paymentStatus: "pending",
      stripeSessionId: order.id,
    });

    res.json({ orderId: order.id });
  } catch (err) {
    console.error("PayPal create-order exception:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Capture a PayPal order after the buyer approves it
const CaptureOrderBody = zod.object({
  orderId: zod.string(),
  linkId: zod.string(),
});

router.post("/payments/paypal/capture-order", async (req, res) => {
  const parsed = CaptureOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { orderId, linkId } = parsed.data;

  try {
    const token = await getPayPalToken();
    const base = getPayPalBase();

    const captureRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureRes.ok) {
      const err = await captureRes.text();
      console.error("PayPal capture error:", err);
      res.status(502).json({ error: "Failed to capture PayPal payment" });
      return;
    }

    const capture = (await captureRes.json()) as { status: string; id: string };

    if (capture.status === "COMPLETED") {
      await db
        .update(paymentsTable)
        .set({ paymentStatus: "paid", stripePaymentIntentId: capture.id })
        .where(eq(paymentsTable.stripeSessionId, orderId));

      const reservation = await db.query.reservationsTable.findFirst({
        where: eq(reservationsTable.linkId, linkId),
      });

      if (reservation) {
        await db
          .update(reservationsTable)
          .set({ status: "confirmed", updatedAt: new Date() })
          .where(eq(reservationsTable.id, reservation.id));
      }

      res.json({ status: "success" });
    } else {
      res.status(400).json({ error: "Payment not completed", captureStatus: capture.status });
    }
  } catch (err) {
    console.error("PayPal capture exception:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payments", async (req, res) => {
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
    where: eq(paymentsTable.businessId, business.id),
    with: { reservation: true },
    orderBy: [desc(paymentsTable.createdAt)],
  }) as any[];

  res.json(
    payments.map((p) => ({
      id: p.id,
      reservationId: p.reservationId,
      customerName: p.reservation?.customerName ?? "Unknown",
      amount: Number(p.amount),
      currency: p.currency,
      paymentStatus: p.paymentStatus,
      paypalOrderId: p.stripeSessionId,
      createdAt: p.createdAt.toISOString(),
      date: p.reservation?.date ?? null,
      time: p.reservation?.time ?? null,
    }))
  );
});

export default router;
