/**
 * Source of truth: sampled directly from the official Optimum Optic logo
 * artwork (the burgundy background + cream interlocked-rings mark). These
 * are not invented — see the sampled RGB values in comments.
 */
export const theme = {
  colors: {
    /** rgb(107,31,42) — the logo's background plate */
    primary: "#6b1f2a",
    /** one step deeper, used for gradients/depth only */
    primaryDeep: "#551821",
    /** rgb(213,191,165) — the ring mark's base tone */
    secondary: "#d9c3a6",
    /** rgb(245,222,190) — the ring mark's lit highlight */
    secondaryLight: "#f2e2c6",
    /** rgb(162,134,113) — the ring mark's shaded edge */
    secondaryShadow: "#b7997a",
  },
  fonts: {
    /**
     * Substitution: no official brand font file was supplied. The logo's
     * wordmark is a geometric sans with rounded terminals and wide
     * tracking — Poppins is the closest professional match and is used
     * for all display type (headlines, the brand mark).
     */
    display: "var(--font-display)",
    /** Inter for body copy — chosen purely for small-size legibility. */
    body: "var(--font-body)",
  },
} as const;
