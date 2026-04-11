/**
 * Parent fee checkout: which providers are demo-only server mock rails vs production.
 * UI visibility is controlled by {@link runtimeConfig.showDemoPaymentRails}; routing is always {@code POST} checkout-session / confirm on the API.
 */

/** Providers handled by Spring {@code MockPaymentGatewayClient} (no external PSP). */
export const PARENT_DEMO_GATEWAY_PROVIDERS = ['mockpay', 'upi', 'netbanking'] as const;
export type ParentDemoGatewayProvider = (typeof PARENT_DEMO_GATEWAY_PROVIDERS)[number];

export function isParentDemoGatewayProvider(provider: string | undefined): boolean {
  const p = (provider ?? '').toLowerCase();
  return (PARENT_DEMO_GATEWAY_PROVIDERS as readonly string[]).includes(p);
}
