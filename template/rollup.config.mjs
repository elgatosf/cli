import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const isWatching = !!process.env.ROLLUP_WATCH;
const tsConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./tsconfig.json"), "utf8"));

prepareOutDir(tsConfig.compilerOptions.outDir);

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
	input: "src/plugin.ts",
	output: {
		dir: tsConfig.compilerOptions.outDir,
		format: "cjs",
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		}
	},
	plugins: [
		typescript({
			sourceMap: isWatching,
			inlineSources: isWatching,
			mapRoot: isWatching ? "./" : undefined
		}),
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
 * @param {string} outDir
 */
function prepareOutDir(outDir) {
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
