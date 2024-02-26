import { Manifest } from "@elgato/schemas/streamdeck/plugins";
import { ZipWriter } from "@zip.js/zip.js";
import chalk from "chalk";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { Readable, Writable } from "node:stream";
import { command } from "../common/command";
import { getPluginId } from "../stream-deck";
import { getFiles, mkdirIfNotExists, readJsonFile, sizeAsString, type FileInfo } from "../system/fs";
import { defaultOptions, validate, type ValidateOptions } from "./validate";

/**
 * TODO:
 * - Add an `-f|--force` option; generate the file even if it already exists.
 * - Add an `-o|--output` option; output directory where the file will be created.
 * - Add an `-v|--version` option; version the manifest.json file. Optional, when empty reads package.json, or value is used.
 */

/**
 * Packs the plugin to a `.streamDeckPlugin` files.
 */
export const pack = command<PackOptions>(
	async (options, stdout) => {
		// Validate the plugin.
		await validate({
			...options,
			quietSuccess: true
		});

		// Determine the source, and output.
		const sourcePath = resolve(options.path);
		const outputPath = resolve(options.output, `${getPluginId(sourcePath)}.streamDeckPlugin`);

		// Check if there is already a file at the desired save location.
		if (existsSync(outputPath)) {
			if (options.force) {
				await rm(outputPath);
			} else {
				stdout.error("File already exists").log("Specify a different -o|-output location, or -f|--force saving to overwrite the existing file").exit(1);
			}
		}

		// Create the package
		await mkdirIfNotExists(dirname(outputPath));
		const pkgBuilder = getPackageBuilder(sourcePath, outputPath, options.dryRun);
		const contents = await getPackageContents(sourcePath, pkgBuilder.add);
		pkgBuilder.close();

		// Print a summary of the contents.
		stdout.log(`📦 ${contents.manifest.Name} (v${contents.manifest.Version})`);
		stdout.log();
		stdout.log(chalk.cyan("Plugin Contents"));

		contents.files.forEach((file, i) => {
			stdout.log(`${chalk.dim(i === contents.files.length - 1 ? "└─" : "├─")}  ${file.size.text.padEnd(contents.sizePad)}  ${file.path.relative}`);
		});

		// Print the package details.
		stdout
			.log()
			.log(chalk.cyan("Plugin Details"))
			.log(`  Name:           ${contents.manifest.Name}`)
			.log(`  Version:        ${contents.manifest.Version}`)
			.log(`  UUID:           ${contents.manifest.UUID}`)
			.log(`  Filename:       ${basename(outputPath)}`)
			.log(`  Unpacked size:  ${sizeAsString(contents.size)}`)
			.log(`  Total files:    ${contents.files.length}`)
			.log();

		if (!options.dryRun) {
			stdout.success("Successfully packaged plugin").log().log(outputPath);
		} else {
			stdout.log(chalk.dim(outputPath));
		}
	},
	{
		...defaultOptions,
		dryRun: false,
		force: false,
		output: process.cwd()
	}
);

/**
 * Gets a package builder capable of constructing a `.streamDeckPlugin` file.
 * @param sourcePath Source path to the package contents.
 * @param outputPath Path where the package will be output too.
 * @param dryRun When `true`, the builder will not create a package output.
 * @returns The package builder.
 */
function getPackageBuilder(sourcePath: string, outputPath: string, dryRun = false): PackageBuilder {
	// When a dry-run, return a mock builder.
	if (dryRun) {
		return {
			add: () => Promise.resolve(),
			close: (): void => {}
		};
	}

	// Otherwise prepare the builder
	const entryPrefix = basename(sourcePath);
	const zipStream = new ZipWriter(Writable.toWeb(createWriteStream(outputPath)));

	return {
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
type PackOptions = ValidateOptions & {
	/**
	 * When `true`, the package will be evaluated, but not created.
	 */
	dryRun?: boolean;

	/**
	 * When `true`, the output will overwrite an existing `.streamDeckPlugin` file if it already exists.
	 */
	force?: boolean;

	/**
	 * Output directory where the plugin package will be written too; defaults to cwd.
	 */
	output?: string;
};

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
	 * Adds the specified {@link file} to the package.
	 * @param file File to add.
	 */
	add(file: FileInfo): Promise<void>;

	/**
	 * Closes the package builder.
	 */
	close(): void;
};
