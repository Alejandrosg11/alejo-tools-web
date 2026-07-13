export const ANALYTICS_CONSENT_STORAGE_KEY = "alejo_analytics_consent";
export const ANALYTICS_CONSENT_CHANGE_EVENT = "alejo:analytics-consent-change";

export type AnalyticsPlacement = "sidebar" | "post_result";
export type ResultBand = "low" | "uncertain" | "high";
export type AnalysisErrorCategory =
  | "validation"
  | "bot_verification"
  | "rate_limit"
  | "network"
  | "server";

export type AlejoAnalyticsEvent =
  | { name: "analysis_started" }
  | { name: "analysis_success"; resultBand: ResultBand }
  | { name: "analysis_error"; errorCategory: AnalysisErrorCategory }
  | {
      name: "affiliate_impression" | "affiliate_click";
      affiliateId: string;
      placement: AnalyticsPlacement;
    }
  | { name: "kofi_click"; placement: "post_result" };

type GtagCommand = "config" | "consent" | "event" | "js";
type GtagParameters = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: GtagCommand,
      targetOrAction: string | Date,
      parameters?: GtagParameters,
    ) => void;
  }
}

const measurementId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim();

export function hasGrantedAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return (
      window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY) === "granted"
    );
  } catch {
    return false;
  }
}

const canTrack = (): boolean =>
  process.env.NODE_ENV === "production" &&
  Boolean(measurementId) &&
  typeof window !== "undefined" &&
  typeof window.gtag === "function" &&
  hasGrantedAnalyticsConsent();

const normalizePublicId = (value: string): string => value.trim().slice(0, 100);

export function trackAlejoEvent(event: AlejoAnalyticsEvent): void {
  if (!canTrack()) return;

  switch (event.name) {
    case "analysis_started":
      window.gtag?.("event", event.name);
      return;
    case "analysis_success":
      window.gtag?.("event", event.name, { result_band: event.resultBand });
      return;
    case "analysis_error":
      window.gtag?.("event", event.name, { error_category: event.errorCategory });
      return;
    case "affiliate_impression":
    case "affiliate_click": {
      const affiliateId = normalizePublicId(event.affiliateId);
      if (!affiliateId) return;

      window.gtag?.("event", event.name, {
        affiliate_id: affiliateId,
        placement: event.placement,
      });
      return;
    }
    case "kofi_click":
      window.gtag?.("event", event.name, { placement: event.placement });
  }
}
