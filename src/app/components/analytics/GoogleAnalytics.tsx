"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import {
  hasGrantedAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from "@/lib/analytics";

const measurementId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim();
const isProduction = process.env.NODE_ENV === "production";

const subscribeToConsent = (onStoreChange: () => void): (() => void) => {
  if (!isProduction || !measurementId) return () => {};

  const syncConsent = () => {
    window.gtag?.("consent", "update", {
      analytics_storage: hasGrantedAnalyticsConsent() ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    onStoreChange();
  };

  return subscribeToAnalyticsConsent(syncConsent);
};

const getConsentSnapshot = (): boolean =>
  isProduction &&
  Boolean(measurementId) &&
  hasGrantedAnalyticsConsent();

const getServerConsentSnapshot = (): boolean => false;

export default function GoogleAnalytics() {
  const hasAnalyticsConsent = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );

  if (!isProduction || !measurementId || !hasAnalyticsConsent) return null;

  return (
    <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      strategy="afterInteractive"
      onLoad={() => {
        window.gtag?.("consent", "update", { analytics_storage: "granted" });
        window.gtag?.("config", measurementId, {
          send_page_view: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
      }}
    />
  );
}
