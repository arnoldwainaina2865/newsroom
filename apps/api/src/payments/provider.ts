/**
 * One interface, two real implementations (Stripe for card, M-Pesa for
 * Daraja STK Push). Routes and webhook handlers depend only on this
 * interface so a new provider (Paystack, Flutterwave) is a third file,
 * not a rewrite.
 */
export interface CheckoutParams {
  payloadUserId: string;
  email: string;
  plan: "monthly" | "annual";
}

export interface CheckoutResult {
  /** URL to redirect to (Stripe Checkout) or null if the flow is push-based (M-Pesa STK). */
  redirectUrl: string | null;
  providerReference: string;
}

export interface PaymentProvider {
  readonly name: "stripe" | "mpesa";
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  /** Verifies and normalizes an inbound webhook/callback payload. */
  parseWebhookEvent(rawBody: Buffer, headers: Record<string, string>): Promise<NormalizedEvent>;
}

export type NormalizedEvent =
  | { type: "subscription.activated"; providerSubscriptionId: string; providerCustomerId: string; currentPeriodEnd: Date }
  | { type: "subscription.renewed"; providerSubscriptionId: string; currentPeriodEnd: Date }
  | { type: "subscription.canceled"; providerSubscriptionId: string }
  | { type: "subscription.payment_failed"; providerSubscriptionId: string };
