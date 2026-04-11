/**
 * Loads Razorpay Checkout.js and opens the hosted widget. Server creates the order; browser only needs key_id + order_id.
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps
 */

export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOpenable {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayOpenable;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay requires a browser'));
  }
  if (window.Razorpay) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed')), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Razorpay script failed to load'));
    document.body.appendChild(s);
  });
}

export function openRazorpaySchoolFeeCheckout(opts: {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  name: string;
  description: string;
  prefillEmail?: string;
  onSuccess: (r: RazorpayHandlerResponse) => void;
  onDismiss: () => void;
  /** Script blocked, offline, or Checkout failed to initialize. */
  onLoadError?: (message: string) => void;
}): void {
  void loadRazorpayScript()
    .then(() => {
      const R = window.Razorpay;
      if (!R) {
        opts.onLoadError?.('Razorpay Checkout did not load. Check network and that checkout.razorpay.com is allowed (CSP).');
        opts.onDismiss();
        return;
      }
      const rzp = new R({
        key: opts.keyId,
        amount: opts.amountPaise,
        currency: opts.currency,
        order_id: opts.orderId,
        name: opts.name,
        description: opts.description,
        prefill: opts.prefillEmail ? { email: opts.prefillEmail } : undefined,
        handler(response: RazorpayHandlerResponse) {
          opts.onSuccess(response);
        },
        modal: {
          ondismiss() {
            opts.onDismiss();
          },
        },
      });
      rzp.open();
    })
    .catch(err => {
      const msg = err instanceof Error ? err.message : 'Could not load Razorpay Checkout.';
      opts.onLoadError?.(msg);
      opts.onDismiss();
    });
}
