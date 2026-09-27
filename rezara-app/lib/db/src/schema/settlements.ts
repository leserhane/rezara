import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";

export const revenueSettlementsTable = pgTable("revenue_settlements", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id),
  settledAmount: numeric("settled_amount", { precision: 10, scale: 2 }).notNull(),
  evidenceUrl: text("evidence_url").notNull(),
  notes: text("notes"),
  settledBy: text("settled_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RevenueSettlement = typeof revenueSettlementsTable.$inferSelect;
