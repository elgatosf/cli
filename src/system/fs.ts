import { existsSync, lstatSync, readdirSync } from "node:fs";
import { platform } from "node:os";
import { basename, resolve } from "node:path";

/**
 * Gets file information for all files within the specified {@link path}.
 * @param path Path to the directory to read.
 * @yields Files in the directory.
 */
export function* getFiles(path: string): Generator<FileInfo> {
	if (!existsSync(path)) {
		return;
	}

	if (!lstatSync(path).isDirectory()) {
		throw new Error("Path is not a directory");
	}

	// We don't use withFileTypes as this yields incomplete results in Node.js 20.5.1; as we need the size anyway, we instead can rely on lstatSync as a direct call.
	for (const entry of readdirSync(path, { encoding: "utf-8", recursive: true })) {
		const absolute = resolve(path, entry);
		const stats = lstatSync(absolute);

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
