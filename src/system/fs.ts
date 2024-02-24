import ignore from "ignore";
import { cpSync, createReadStream, existsSync, lstatSync, mkdirSync, readlinkSync, rmSync, type Stats } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import { platform } from "node:os";
import { basename, join, resolve } from "node:path";
import { createInterface } from "node:readline";

export const streamDeckIgnoreFilename = ".sdignore";

/**
 * Gets files within the specified {@link path}, and their associated information, for example file size. When a `.sdignore` file is found within the {@link path}, it is respected,
 * and the files are ignored.
 * @param path Path to the directory to read.
 * @yields Files in the directory.
 */
export async function* getFiles(path: string): AsyncGenerator<FileInfo> {
	if (!existsSync(path)) {
		return;
	}

	if (!lstatSync(path).isDirectory()) {
		throw new Error("Path is not a directory");
	}

	const ignores = await getIgnores(path);

	// We don't use withFileTypes as this yields incomplete results in Node.js 20.5.1; as we need the size anyway, we instead can rely on lstatSync as a direct call.
	for (const entry of await readdir(path, { encoding: "utf-8", recursive: true })) {
		// Ensure the file isn't ignored.
		if (ignores(entry)) {
			continue;
		}

		const absolute = resolve(path, entry);
		const stats = await lstat(absolute);

		// We only want files.
		if (!stats.isFile()) {
			continue;
		}

		yield {
			name: basename(absolute),
			path: {
				absolute,
				relative: entry
			},
			size: {
				bytes: stats.size,
				text: sizeAsString(stats.size)
			}
		};
	}
}

/**
 * Builds an ignore predicate from the `.sdignore` file located within the specified {@link path}. The predicate will return `true` when the path supplied to it should be ignored.
 * @param path Path to the directory that contains the optional `.sdignore` file.
 * @returns Predicate that determines whether the path should be ignored; returns `true` when the path should be ignored.
 */
export async function getIgnores(path: string): Promise<(path: string) => boolean> {
	const file = join(path, streamDeckIgnoreFilename);
	if (!existsSync(file)) {
		return () => false;
	}

	// Open the ".sdignore" to determine the ignore patterns.
	const fileStream = createReadStream(file);
	const i = ignore().add(streamDeckIgnoreFilename);

	try {
		const rl = createInterface({
			input: fileStream,
			crlfDelay: Infinity
		});

		// Treat each line as a pattern, adding it to the ignore.
		for await (const line of rl) {
			i.add(line);
		}
	} finally {
		fileStream.close();
	}

	return (p) => i.ignores(p);
}

/**
 * Determines whether the specified {@link path}, or the path it links to, is a directory.
 * @param path The path.
 * @returns `true` when the path, or the path it links to, is a directory; otherwise `false`.
 */
export function isDirectory(path: string): boolean {
	return checkStats(path, (stats) => stats?.isDirectory() === true);
}

/**
 * Determines whether the specified {@link path}, or the path it links to, is a file.
 * @param path The path.
 * @returns `true` when the path, or the path it links to, is a file; otherwise `false`.
 */
export function isFile(path: string): boolean {
	return checkStats(path, (stats) => stats?.isFile() === true);
}

/**
 * Synchronously moves the {@link source} to the {@link dest} path.
 * @param source Source path being moved.
 * @param dest Destination where the {@link source} will be moved to.
 * @param options Options that define the move.
 */
export function moveSync(source: string, dest: string, options?: MoveOptions): void {
	if (!existsSync(source)) {
		throw new Error("Source does not exist");
	}

	if (!lstatSync(source).isDirectory()) {
		throw new Error("Source must be a directory");
	}

	if (existsSync(dest)) {
		if (options?.overwrite) {
			rmSync(dest, { recursive: true });
		} else {
			throw new Error("Destination already exists");
		}
	}

	// Ensure the new directory exists, copy the contents, and clean-up.
	mkdirSync(dest, { recursive: true });
	cpSync(source, dest, { recursive: true });
	rmSync(source, { recursive: true });
}

/**
 * Defines how a path will be relocated.
 */
type MoveOptions = {
	/**
	 * When the destination path already exists, it will be overwritten.
	 */
	overwrite?: boolean;
};

/**
 * Gets the platform-specific string representation of the file size, to 1 decimal place. For example, given 1060 bytes:
 * - macOS would yield "1.1 kB" as it is decimal based (1000).
 * - Windows would yield "1.0 KiB" as it is binary-based (1024).
 * @param bytes Size in bytes.
 * @returns String representation of the size.
 */
export function sizeAsString(bytes: number): string {
	const isBinary = platform() === "win32";
	const units = isBinary ? ["KiB", "MiB", "GiB", "TiB"] : ["kB", "MB", "GB", "TB"];
	const unitSize = isBinary ? 1024 : 1000;

	if (bytes < unitSize) {
		return `${bytes} B`;
	}

	let i = -1;
	do {
		bytes /= unitSize;
		i++;
	} while (Math.round(bytes) >= unitSize);

	return `${bytes.toFixed(1)} ${units[i]}`;
}

/**
 * Checks the stats of a given path and applies the {@link check} to them to determine the result.
 * @param path Path to check; when the path represents a symbolic link, the link is referenced.
 * @param check Function used to determine if the stats fulfil the check.
 * @returns `true` when the stats of the {@link path} fulfil the {@link check}; otherwise `false`.
 */
function checkStats(path: string, check: (stats?: Stats) => boolean): boolean {
	const stats = lstatSync(path, { throwIfNoEntry: false });
	if (stats === undefined) {
		return false;
	}

	if (stats.isSymbolicLink()) {
		return checkStats(readlinkSync(path), check);
	}

	return check(stats);
}

/**
 * Information about a file.
 */
export type FileInfo = {
	/**
	 * Name of the file.
	 */
	name: string;

	/**
	 * Path to the file.
	 */
	path: {
		/**
		 * Absolute path to the file.
		 */
		absolute: string;

		/**
		 * Relative path to the file.
		 */
		relative: string;
	};

	/**
	 * Size of the file in bytes.
	 */
	size: {
		/**
		 * Size in bytes.
		 */
		bytes: number;

		/**
		 * String representation of the size, for example "1.8 GiB", "2.3 kB", etc.
		 */
		text: string;
	};
};
