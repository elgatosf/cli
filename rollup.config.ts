import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { RollupOptions } from "rollup";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const isWatching = !!process.env.ROLLUP_WATCH;
const tsConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./tsconfig.json"), "utf8"));

prepareOutDir(tsConfig.compilerOptions.outDir);

const config: RollupOptions = {
	input: "src/index.ts",
	output: {
		banner: "#!/usr/bin/env node",
		file: path.join(tsConfig.compilerOptions.outDir, "streamdeck.mjs"),
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath: string, sourcemapPath: string): string => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		}
	},
	plugins: [
		typescript({
			sourceMap: isWatching,
			inlineSources: isWatching,
			mapRoot: isWatching ? "./" : undefined
		}),
		json(),
		commonjs({
			sourceMap: false
		}),
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

/**
 * Validates the output directory is situated within the current working directory; upon passing validation, the directory is cleaned before build.
 * @param outDir The output directory.
 */
function prepareOutDir(outDir: string): void {
	if (outDir === undefined) {
		throw new Error("outDir must be specified within the TypeScript config file.");
	}

	const relative = path.relative(__dirname, outDir);
	if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
		if (fs.existsSync(outDir)) {
			fs.rmSync(outDir, { recursive: true });
		}
	} else {
		throw new Error("outDir must be located within the current working directory. Please review the TypeScript config file.");
	}
}