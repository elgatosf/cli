import { ZipWriter } from "@zip.js/zip.js";
import { createReadStream, createWriteStream } from "node:fs";
import { basename, join, resolve } from "node:path";
import { Readable, Writable } from "node:stream";
import { command } from "../common/command";
import { getPluginId } from "../stream-deck";
import { getFiles } from "../system/fs";
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
	await validate({
		...options,
		quietSuccess: true
	});

	const path = resolve(options.path);
	const output = resolve(process.cwd(), `${getPluginId(path)}.streamDeckPlugin`);
	const fileStream = Writable.toWeb(createWriteStream(output));
	const zip = new ZipWriter(fileStream);
	const prefix = basename(path);

	for (const file of getFiles(path)) {
		const name = join(prefix, file.path.relative).replaceAll("\\", "/");
		await zip.add(name, Readable.toWeb(createReadStream(file.path.absolute)));
	}

	await zip.close();
	stdout.success("Created");
}, defaultOptions);

/**
 * Options available to {@link pack}.
 */
type PackOptions = ValidateOptions;
