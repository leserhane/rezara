// Only the runtime Zod schemas are re-exported. `./generated/types` declares
// TypeScript types with the same names as these schemas (e.g.
// CreateReservationBody), and re-exporting both made `tsc --build` fail with
// TS2308 ambiguity errors. Infer types from the schemas with `z.infer` instead.
export * from "./generated/api";
export * from "./auth";
