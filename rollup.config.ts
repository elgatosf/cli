import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import url from "node:url";
import { RollupOptions } from "rollup";

const isWatching = !!process.env.ROLLUP_WATCH;

const banner = `#!/usr/bin/env node

/**!
 * @author Elgato
 * @module elgato/streamdeck
 * @license MIT
 * @copyright Copyright (c) Corsair Memory Inc.
 */`

// Ignore @elgato/schema to enable auto-update.
const external = [
	"@elgato/schemas",
	"@elgato/schemas/streamdeck/plugins/",
	"@elgato/schemas/streamdeck/plugins/json",
];

/**
 * CLI bundling.
 */
const options: RollupOptions = {
	input: "src/cli.ts",
	output: {
		banner,
		file: "bin/streamdeck.mjs",
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath: string, sourcemapPath: string): string => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		},
	},
	external,
	plugins: [
		typescript(),
		json(),
		commonjs(),
		nodeResolve({
			browser: false,
			exportConditions: ["node"],
			preferBuiltins: true,
		}),
		!isWatching &&
			terser({
				format: {
					comments: false,
				},
			}),
	],
}

export default options;
