import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, rmSync, Stats } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Determines whether the specified {@link application} is accessible from the environment's PATH variable and can be executed.
 * @param application Name of the application to search for.
 * @returns `true` when the application is considered executable; otherwise `false`.
 */
export function isExecutable(application: string): boolean {
	for (const path of process.env.PATH?.split(delimiter) || []) {
		if (existsSync(path) && isDirectory(path) && readdirSync(path).find((entry) => entry === application && isFile(join(path, entry)))) {
			return true;
		}
	}

	return false;
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
 * Validates the specified {@link value} represents a valid directory name.
 * @param value Value to validate.
 * @returns `true` when the {@link value} represents a valid directory name; otherwise `false`.
 */
export function isSafeBaseName(value: string): boolean {
	// Check the name is defined.
	if (value.trim().length === 0) {
		return false;
	}

	// Check the name does not begin with a period.
	if (value.trim().startsWith(".")) {
		return false;
	}

	// Check the name does not contain an invalid character.
	return !invalidCharacters.some((invalid) => value.includes(invalid));
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
 * Resolves the specified {@link path} relatives to the entry point.
 * @param path Path being resolved.
 * @returns The resolve path relative to the entry point.
 */
export function relative(path: string): string {
	return resolve(dirname(fileURLToPath(import.meta.url)), path);
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
 * Collection of characters that are considered invalid when part of a directory name.
 */
export const invalidCharacters = ["\\", "/", ":", "*", "?", '"', "<", ">", "|"];
