import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.tsx"],
    env: {
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "component-test-site-key",
      NEXT_PUBLIC_BYPASS_TURNSTILE_IN_LOCAL_DEV: "false",
      NEXT_PUBLIC_TURNSTILE_USE_TEST_KEY_IN_DEV: "false",
    },
  },
});
