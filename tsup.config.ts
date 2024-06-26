import { defineConfig } from "tsup";

const banner = {
	js: `/**!
 * @author Elgato
 * @module elgato/streamdeck
 * @license MIT
 * @copyright Copyright (c) Corsair Memory Inc.
 */`,
};

export default defineConfig([
	{
		/**
		 * Programmatic interface.
		 */
		entry: {
			index: "src/index.ts",
		},
		outDir: "dist",
		format: ["cjs", "esm"],
		banner,
		clean: true,
		dts: true,
	},
	{
		/**
		 * CLI interface.
		 */
		entry: {
			streamdeck: "src/cli.ts",
		},
		outDir: "bin",
		format: "esm",
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		outExtension: () => ({ js: ".mjs" }),
		banner,
		clean: true,
	},
]);
