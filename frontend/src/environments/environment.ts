/**
 * =============================================================================
 * LOCAL DEVELOPMENT — flip `useMocks` + `apiUrl` only; production uses `environment.prod.ts`.
 * =============================================================================
 * Mock session: both TTLs apply only when `useMocks: true` (non-JWT demo tokens).
 * Set them equal (e.g. both 60_000) to log out fully after ~1 minute; use longer values for normal dev.
 */
export const environment = {
  production: false,
  useMocks: true,
  /**
   * Parent Pay: show Instant / UPI / Netbanking demo tiles and “demo” bank-transfer completion. Checkout always calls Spring (`RoutingPaymentGatewayClient`).
   * Production builds set false so real customers only see Razorpay (+ Stripe placeholder, manual NEFT copy).
   */
  showDemoPaymentRails: true,
  apiUrl: 'http://localhost:8080/api/v1',
  /** Dev-friendly TTLs; use 60_000 + 60_000 only when testing expiry flows. */
  mockSessionAccessTtlMs: 86_400_000,
  mockSessionRefreshTtlMs: 604_800_000
};
