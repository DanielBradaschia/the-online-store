import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so tests don't load the React Router
// and Tailwind plugins — the code under test is plain TypeScript.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});