import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["tests/unit/**/*.test.ts", "src/**/*.test.ts"],
		coverage: {
			reporter: ["text", "json", "html"],
		},
	},
	resolve: {
		alias: {
			"#": path.resolve(import.meta.dirname, "./src"),
			"@": path.resolve(import.meta.dirname, "./src"),
		},
	},
});
