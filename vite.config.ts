import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/One-Standard-Deviation/",
  plugins: [react()],
  test: { environment: "node" },
});
