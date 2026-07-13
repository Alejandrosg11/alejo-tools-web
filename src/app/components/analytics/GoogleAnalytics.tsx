"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import {
  ANALYTICS_CONSENT_CHANGE_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
} from "@/lib/analytics";

const measurementId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim();
const isProduction = process.env.NODE_ENV === "production";

const hasGrantedConsent = (): boolean =>
  window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY) === "granted";

const subscribeToConsent = (onStoreChange: () => void): (() => void) => {
  const syncConsent = () => {
    window.gtag?.("consent", "update", {
      analytics_storage: hasGrantedConsent() ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    onStoreChange();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === ANALYTICS_CONSENT_STORAGE_KEY) {
      syncConsent();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, syncConsent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, syncConsent);
  };
};

const getConsentSnapshot = (): boolean =>
  isProduction &&
  Boolean(measurementId) &&
  hasGrantedConsent();

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
