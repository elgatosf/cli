import ncc from "@vercel/ncc";
import fs from "node:fs";
import path from "node:path";
import url, { fileURLToPath } from "node:url";
import * as terser from "terser";

console.time("Build time");
console.log("Building...");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const {
	compilerOptions: { outDir, sourceMap }
} = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../tsconfig.json"), "utf8"));

const options = {
	source: path.resolve(__dirname, "../src/plugin.ts"),
	outDir: path.resolve(__dirname, "../", outDir),
	dest: path.resolve(__dirname, "../", outDir, "index.js"),
	destMap: path.resolve(__dirname, "../", outDir, "index.js.map"),
	minify: hasOption("-m", "--minify"),
	sourceMap: sourceMap || hasOption("-s", "--source-map")
};

/**
 * Determines whether the option is present as part of the command-line arguments.
 * @param  {...any} args Argument to find.
 * @returns `true` when then argument is present in the command-line arguments; otherwise `false`
 */
function hasOption(...args) {
	return Array.from(args).find((a) => process.argv.includes(a)) !== undefined;
}

/**
 * Builds the plugin to a single output.
 * @returns The output of the build.
 */
async function build() {
	const buildOutput = await ncc(options.source, {
		sourceMap: options.sourceMap,
		sourceMapBasePrefix: url.pathToFileURL(`${path.resolve(__dirname, "../")}/`).href, // Use absolute paths for sym-linking.
		sourceMapRegister: false,
		quiet: true
	});

	return options.minify ? minify(buildOutput) : buildOutput;
}

/**
 * Minifies the {@link code}; when a {@link map} is provided, the minified output will reference the original source-map.
 * @returns The output of the minified build.
 */
function minify({ code, map }) {
	return terser.minify(
		{
			"index.js": code
		},
		map !== undefined
			? {
					sourceMap: {
						content: map,
						url: "index.js.map"
					}
			  }
			: {}
	);
}

try {
	const { code, map } = await build();

	// Write the code output to the destination.
	fs.mkdirSync(path.dirname(options.dest), { recursive: true });
	fs.writeFileSync(options.dest, code);

	// Write, or remove, the accompanying source-map file.
	if (map) {
		fs.writeFileSync(options.destMap, map);
	} else if (fs.existsSync(options.destMap)) {
		fs.rmSync(options.destMap);
	}

	console.timeEnd("Build time");
} catch (e) {
	console.log(e);
}
