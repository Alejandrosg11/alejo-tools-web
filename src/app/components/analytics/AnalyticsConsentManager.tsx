"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics";
import GoogleAnalytics from "./GoogleAnalytics";
import styles from "./AnalyticsConsentManager.module.scss";

const getServerConsent = (): null => null;
const subscribeToHydration = (): (() => void) => () => undefined;
const getClientHydrationState = (): true => true;
const getServerHydrationState = (): false => false;

export default function AnalyticsConsentManager() {
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    getServerConsent,
  );
  const isMounted = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationState,
    getServerHydrationState,
  );
  const [isDismissedForSession, setIsDismissedForSession] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const shouldShowBanner =
    isMounted && !isDismissedForSession && consent === null;

  const chooseConsent = (nextConsent: AnalyticsConsent) => {
    const wasStored = setAnalyticsConsent(nextConsent);
    setStorageError(!wasStored);

  };

  const closeBanner = () => {
    setIsDismissedForSession(true);
  };

  return (
    <>
      <GoogleAnalytics />
      {consent === "granted" && <SpeedInsights />}

      {shouldShowBanner && (
        <section
          className={styles.banner}
          role="dialog"
          aria-modal="false"
          aria-label="Preferencias de analítica"
        >
          <div className={styles.header}>
            <p className={styles.title}>Analítica opcional</p>
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeBanner}
              aria-label="Cerrar y usar solo lo necesario"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className={styles.copy}>
            <p className={styles.description}>
              Usamos medición para entender qué funciona y mejorar Alejo Tools.
              No enviamos imágenes, nombres de archivo ni resultados exactos.{" "}
              <Link href="/privacy">Consulta la política de privacidad</Link>.
            </p>
            {storageError && (
              <p className={styles.error} role="alert">
                Tu navegador bloqueó el almacenamiento de esta preferencia. La
                analítica seguirá desactivada.
              </p>
            )}
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => chooseConsent("granted")}
            >
              Aceptar
            </button>
          </div>
        </section>
      )}
    </>
  );
}
