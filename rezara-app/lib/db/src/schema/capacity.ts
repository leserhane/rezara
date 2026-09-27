import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";

export const capacitySlotsTable = pgTable("capacity_slots", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businessesTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  startTime: text("start_time"),
  durationHours: integer("duration_hours"),
  maxCapacity: integer("max_capacity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCapacitySlotSchema = createInsertSchema(capacitySlotsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCapacitySlot = z.infer<typeof insertCapacitySlotSchema>;
export type CapacitySlot = typeof capacitySlotsTable.$inferSelect;
