import { relations } from "drizzle-orm";
import { businessesTable } from "./businesses";
import { reservationsTable } from "./reservations";
import { paymentsTable } from "./payments";
import { capacitySlotsTable } from "./capacity";
import { revenueSettlementsTable } from "./settlements";

export const businessRelations = relations(businessesTable, ({ many }) => ({
  reservations: many(reservationsTable),
  payments: many(paymentsTable),
  capacitySlots: many(capacitySlotsTable),
  settlements: many(revenueSettlementsTable),
}));

export const reservationRelations = relations(reservationsTable, ({ one, many }) => ({
  business: one(businessesTable, {
    fields: [reservationsTable.businessId],
    references: [businessesTable.id],
  }),
  payments: many(paymentsTable),
}));

export const paymentRelations = relations(paymentsTable, ({ one }) => ({
  reservation: one(reservationsTable, {
    fields: [paymentsTable.reservationId],
    references: [reservationsTable.id],
  }),
  business: one(businessesTable, {
    fields: [paymentsTable.businessId],
    references: [businessesTable.id],
  }),
}));

export const settlementRelations = relations(revenueSettlementsTable, ({ one }) => ({
  business: one(businessesTable, {
    fields: [revenueSettlementsTable.businessId],
    references: [businessesTable.id],
  }),
}));
