import { Manifest } from "@elgato/schemas/streamdeck/plugins";
import { ZipWriter } from "@zip.js/zip.js";
import chalk from "chalk";
import { createReadStream, createWriteStream } from "node:fs";
import { basename, join, resolve } from "node:path";
import { Readable, Writable } from "node:stream";
import { command } from "../common/command";
import { getPluginId } from "../stream-deck";
import { getFiles, readJsonFile, sizeAsString, type FileInfo } from "../system/fs";
import { defaultOptions, validate, type ValidateOptions } from "./validate";

/**
 * TODO:
 * - Add an `-o|--output` option.
 * - Add a `--dry-run` option.
 * - Add output information, similar to `npm pack`.
 */

/**
 * Packs the plugin to a `.streamDeckPlugin` files.
 */
export const pack = command<PackOptions>(async (options, stdout) => {
	// Validate the plugin.
	await validate({
		...options,
		quietSuccess: true
	});

	// Build the package.
	const path = resolve(options.path);
	const pkgBuilder = getPackageBuilder(path);
	const contents = await getPackageContents(path, pkgBuilder.add);
	pkgBuilder.close();

	// Output the contents.
	stdout.log();
	stdout.log(`📦 ${contents.manifest.Name} (v${contents.manifest.Version})`);
	stdout.log();
	stdout.log(chalk.cyan("Plugin Contents"));

	contents.files.forEach((file, i) => {
		stdout.log(`${chalk.dim(i === contents.files.length - 1 ? "└─" : "├─")}  ${file.size.text.padEnd(contents.sizePad)}  ${file.path.relative}`);
	});

	// Output the details.
	stdout
		.log()
		.log(chalk.cyan("Plugin Details"))
		.log(`  Name:           ${contents.manifest.Name}`)
		.log(`  Version:        ${contents.manifest.Version}`)
		.log(`  UUID:           ${contents.manifest.UUID}`)
		.log(`  Filename:       ${basename(pkgBuilder.path)}`)
		.log(`  Unpacked size:  ${sizeAsString(contents.size)}`)
		.log(`  Total files:    ${contents.files.length}`)
		.log();

	stdout.success("Successfully created package");
}, defaultOptions);

/**
 * Gets a package builder capable of constructing a `.streamDeckPlugin` file.
 * @param path Path where the package will be output too.
 * @returns The package builder.
 */
function getPackageBuilder(path: string): PackageBuilder {
	const pkgPath = resolve(process.cwd(), `${getPluginId(path)}.streamDeckPlugin`);

	const entryPrefix = basename(path);
	const zipStream = new ZipWriter(Writable.toWeb(createWriteStream(pkgPath)));

	return {
		path: pkgPath,
		add: async (file: FileInfo): Promise<void> => {
			const name = join(entryPrefix, file.path.relative).replaceAll("\\", "/");
			await zipStream.add(name, Readable.toWeb(createReadStream(file.path.absolute)));
		},
		close: () => zipStream.close()
	};
}

/**
 * Gets the package contents for the specified {@link path}, assuming it has been validated prior.
 * @param path Path to the plugin to package.
 * @param fileFn Optional function called for each file that is considered part of the package.
 * @returns Information about the package contents.
 */
async function getPackageContents(path: string, fileFn?: (file: FileInfo) => Promise<void> | void): Promise<PackageInfo> {
	// Get the manifest, and generate the base contents.
	const manifest = await readJsonFile<Manifest>(join(path, "manifest.json"));
	const contents: PackageInfo = {
		files: [],
		manifest,
		size: 0,
		sizePad: 0
	};

	// Add each file to the contents.
	for await (const file of getFiles(path)) {
		contents.files.push(file);
		contents.sizePad = Math.max(contents.sizePad, file.size.text.length);
		contents.size += file.size.bytes;

		if (fileFn) {
			await fileFn(file);
		}
	}

	return contents;
}

/**
 * Options available to {@link pack}.
 */
type PackOptions = ValidateOptions;

/**
 * Information about the package.
 */
type PackageInfo = {
	/**
	 * Files within the package.
	 */
	files: FileInfo[];

	/**
	 * Manifest the package is associated with.
	 */
	manifest: Manifest;

	/**
	 * Unpacked size of the package, in bytes.
	 */
	size: number;

	/**
	 * Padding used to align file sizes and their names when outputting the contents to a console.
	 */
	sizePad: number;
};

/**
 * Package builder capable of adding files to a package, and outputting them to a `.streamDeckPlugin` file.
 */
type PackageBuilder = {
	/**
	 * Path to the `.streamDeckPlugin` file.
	 */
	path: string;

	/**
	 * Adds the specified {@link file} to the package.
	 * @param file File to add.
	 */
	add(file: FileInfo): Promise<void>;

	/**
	 * Closes the package builder.
	 */
	close(): void;
};
