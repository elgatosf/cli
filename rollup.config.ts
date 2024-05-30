import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import path, { extname } from "node:path";
import url from "node:url";
import { RollupOptions } from "rollup";
import dts from "rollup-plugin-dts";
import {inlineRequires} from "./scripts/inlineRequires"

const isWatching = !!process.env.ROLLUP_WATCH;
const shouldInlineRequires = !!process.env.INLINE_REQUIRES;

/**
 * Ignore @elgato/schema to enable auto-update.
 */
const external = [
	"@elgato/schemas",
	"@elgato/schemas/streamdeck/plugins/",
	"@elgato/schemas/streamdeck/plugins/layout.json",
	"@elgato/schemas/streamdeck/plugins/manifest.json",
];

/**
 * Gets the {@link RollupOptions} for the specified options.
 * @param opts Options to convert to {@link RollupOptions}.
 * @returns The {@link RollupOptions}.
 */
function getOptions(opts: Options): RollupOptions[] {
	const { input, output: file, banner, declarations } = opts;

	/**
	 * TypeScript compiler options.
	 */
	const rollupOpts: RollupOptions[] = [
		{
			input,
			output: {
				banner,
				file,
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
				shouldInlineRequires && inlineRequires(),
			],
		},
	];

	/**
	 * TypeScript declaration options.
	 */
	if (declarations) {
		rollupOpts.push({
			input,
			output: {
				file: `${file.slice(0, extname(file).length * -1)}.d.ts`,
			},
			external,
			plugins: [dts()],
		});
	}

	return rollupOpts;
}

/**
 * Minimal required fields that represent {@link RollupOptions}.
 */
type Options = {
	/**
	 * Input file path.
	 */
	input: string;

	/**
	 * Output file path.
	 */
	output: string;

	/**
	 * Optional banner to prefix to the output contents.
	 */
	banner?: string;

	/**
	 * Determines whether to output declarations.
	 */
	declarations?: boolean;
};

export default [
	...getOptions({
		input: "src/cli.ts",
		output: "bin/streamdeck.mjs",
		banner: "#!/usr/bin/env node",
	}),
	...getOptions({
		input: "src/main.ts",
		output: "dist/index.js",
		declarations: true,
	}),
];
