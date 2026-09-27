import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { UpsertBusinessBody, UpsertBusinessResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/businesses/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const business = await db.query.businessesTable.findFirst({
    where: eq(businessesTable.userId, req.user.id),
  });

  if (!business) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }

  res.json({
    ...business,
    createdAt: business.createdAt.toISOString(),
  });
});

router.post("/businesses/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpsertBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const existing = await db.query.businessesTable.findFirst({
    where: eq(businessesTable.userId, req.user.id),
  });

  let business;
  if (existing) {
    const [updated] = await db
      .update(businessesTable)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(businessesTable.userId, req.user.id))
      .returning();
    business = updated;
  } else {
    const [created] = await db
      .insert(businessesTable)
      .values({
        userId: req.user.id,
        ...parsed.data,
      })
      .returning();
    business = created;
  }

  const validated = UpsertBusinessResponse.parse({
    ...business,
    createdAt: business.createdAt.toISOString(),
  });
  res.json(validated);
});

export default router;
