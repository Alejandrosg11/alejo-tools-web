import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import AnalyticsConsentManager from "./components/analytics/AnalyticsConsentManager";
import "./globals.scss";
import { isQaEnvironment } from "@/lib/environment";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alejo Draws",
  description: "Alejo Draws - Herramienta para artistas digitales",
  ...(isQaEnvironment && { robots: { index: false, follow: false } }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${plusJakartaSans.variable}`}>
        {isQaEnvironment && (
          <aside className="qa-environment-notice" aria-label="Ambiente de pruebas">
            QA · Ambiente de pruebas · Los análisis reales consumen cuota
          </aside>
        )}
        {!isQaEnvironment && <Script id="google-analytics-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });
            gtag('js', new Date());
          `}
        </Script>}
        {children}
        <AnalyticsConsentManager />
      </body>
    </html>
  );
}
