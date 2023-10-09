import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import url from "node:url";
import { RollupOptions } from "rollup";

const isWatching = !!process.env.ROLLUP_WATCH;

const config: RollupOptions = {
	input: "src/index.ts",
	output: {
		banner: "#!/usr/bin/env node",
		file: "bin/streamdeck.mjs",
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath: string, sourcemapPath: string): string => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		}
	},
	plugins: [
		typescript(),
		json(),
		commonjs(),
		nodeResolve({
			browser: false,
			exportConditions: ["node"],
			preferBuiltins: true
		}),
		!isWatching &&
			terser({
				format: {
					comments: false
				}
			})
	]
};

export default config;
