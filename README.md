This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Analytics configuration

Copy `.env.example` to `.env.local` and configure `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
Google Analytics is disabled outside production and its tag is not loaded until the
visitor grants analytics consent. Event payloads must go through the typed helper in
`src/lib/analytics.ts`; do not call `gtag` directly from feature components.

## Component tests

Run `npm test` for the ImageDropzone session/verification and affiliate fallback regression tests
(Vitest, jsdom and React Testing Library). The tests simulate Turnstile and fetch;
they do not call Cloudflare or Sightengine or consume provider quota. They cover
session reuse, renewal with the same image, cancellation and unrelated errors.
Use Node.js 20.19+ (or a compatible newer LTS) for the test tooling.

Before deploying, also run `npx tsc --noEmit`, `npm run lint` and `npm run build`.
The real CAPTCHA and analysis flow still require a manual check in protected QA.

## Dependency maintenance

Next.js and `eslint-config-next` are pinned together at `16.4.6`; React and React
DOM remain at `19.2.3`. Run both `npm audit --package-lock-only` and
`npm audit --package-lock-only --omit=dev` to distinguish the full dependency tree
from the tree excluding development packages. Keep the lockfile with updates and
check tests, types, lint, build, localhost and QA before publishing.

Next.js generates the managed instructions in `AGENTS.md` during development;
the version-specific guides they reference are bundled under
`node_modules/next/dist/docs/`.

DEP-03 refreshes compatible ESLint and lint transitives while preserving Next.js
16.4.6 and React 19.2.3. The full audit still reports development-only advisories
through typescript-eslint's minimatch range; the audit excluding development
packages is checked separately. Out-of-range overrides and the migration from
EOL ESLint 9 are deferred and documented in the workspace audit.

## Local development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Aviso de límites (P1-02)

Ante HTTP 429, el aviso aparece dentro de la subida y antes de Resultados,
con los estilos existentes y sin botones adicionales. La cuenta regresiva
usa una fecha de desbloqueo calculada a partir del tiempo recibido del servidor;
se actualiza al volver a la pestaña y no anuncia cada segundo al lector de pantalla.
Se admite `retryAfterMs` en el cuerpo, `Retry-After` estándar (segundos o fecha HTTP)
y los encabezados con sufijo `short`/`daily` para compatibilidad.

No se muestra el umbral por minuto ni se reenvía una imagen automáticamente.
Se mantiene el resultado anterior emparejado con su imagen si la siguiente
solicitud queda bloqueada. Al terminar la espera se habilita la selección
habitual de otra imagen. Si no hay tiempo válido, se muestra «Intenta más tarde»
sin inventar 30 segundos ni bloquear permanentemente la selección; el servidor
sigue siendo la autoridad sobre cada intento. No se garantiza persistencia del
aviso tras recargar ni disponibilidad de una cuota personal.

`npm test` cubre ambos límites, recuperación sin reenvío, cabeceras anteriores,
tiempo desconocido y la asociación entre imagen y resultado, sin proveedores reales.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
