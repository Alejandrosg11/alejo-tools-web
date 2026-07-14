"use client";

import { useState, useSyncExternalStore } from "react";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from "@/lib/analytics";
import styles from "./AnalyticsPreferenceControl.module.scss";

const getServerConsent = (): null => null;
const subscribeToHydration = (): (() => void) => () => undefined;
const getClientHydrationState = (): true => true;
const getServerHydrationState = (): false => false;

export default function AnalyticsPreferenceControl() {
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
  const [storageError, setStorageError] = useState(false);

  if (!isMounted) return null;

  const isEnabled = consent === "granted";

  const updateAnalyticsPreference = () => {
    const wasStored = setAnalyticsConsent(isEnabled ? "denied" : "granted");
    setStorageError(!wasStored);
  };

  return (
    <div className={styles.control}>
      <p className={styles.status} role="status">
        Estado actual: <strong>{isEnabled ? "activada" : "desactivada"}</strong>
      </p>
      <button
        type="button"
        className={styles.actionButton}
        onClick={updateAnalyticsPreference}
      >
        {isEnabled ? "Desactivar analítica" : "Activar analítica"}
      </button>
      {storageError && (
        <p className={styles.error} role="alert">
          Tu navegador bloqueó el almacenamiento de esta preferencia. Puedes
          borrar los datos del sitio desde la configuración del navegador.
        </p>
      )}
    </div>
  );
}
