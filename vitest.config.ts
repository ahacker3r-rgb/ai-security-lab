import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // The real "server-only" package throws unconditionally outside of
      // Next.js's "react-server" bundler condition. Stub it for tests so
      // modules that import it for production safety remain unit-testable.
      "server-only": path.resolve(__dirname, "./src/test/server-only-stub.ts"),
    },
  },
});
