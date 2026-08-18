export type AccessTier = "free" | "metered" | "premium";

export interface MeterCheckResponse {
  allowed: boolean;
  reason: "subscribed" | "within_free_quota" | "quota_exceeded";
  remaining: number;
}
