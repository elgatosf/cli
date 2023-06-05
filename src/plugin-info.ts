import chalk from "chalk";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Manifest } from "./typings/manifest";

/**
 * Provides information about a plugin.
 */
export class PluginInfo {
	/**
	 * Manifest information associated with the plugin.
	 */
	public manifest: Manifest;

	/**
	 * Path to the manifest.json file.
	 */
	public readonly manifestPath: string;

	/**
	 * Path to the plugins directory; this is the source path, and not the OS installation path.
	 */
	public readonly path: string;

	/**
	 * Initializes a new {@see PluginInfo}.
	 */
	constructor() {
		this.path = process.cwd();
		this.manifestPath = path.join(this.path, "manifest.json");

		if (!fs.existsSync(this.manifestPath)) {
			console.log(`Failed to read plugin information, ${chalk.yellow("manifest.json")} file not found.`);
			process.exit(1);
		}

		this.manifest = JSON.parse(fs.readFileSync(this.manifestPath).toString());
	}

	/**
	 * Generates a UUID from the Author and Name found in the plugin's manifest.json file. Sections are parsed to ensure they result in a whole valid UUID; when one or more
	 * section cannot be parsed, the resulting UUID is `undefined`.
	 * @returns UUID that represents the plugin, from information found in the manifest.json file; otherwise `undefined`.
	 */
	public generateUUID(): string | undefined {
		const author = formatSection(this.manifest?.Author);
		const name = formatSection(this.manifest?.Name);

		if (author === undefined || name === undefined) {
			return;
		}

		return `com.${author}.${name}`;

		/**
		 * Attempts to format the specified `value` as a section of the plugin's UUID; when the `value` results in an empty string, `undefined` is returned.
		 * @param value Value to parse, and make UUID safe.
		 * @returns Value that is safe for a UUID section; otherwise `undefined`.
		 */
		function formatSection(value: string | undefined): string | undefined {
			if (value === undefined) {
				return undefined;
			}

			const safeValue = value
				.toLowerCase()
				.replaceAll(" ", "-")
				.replaceAll(/[^\-a-z0-9_]/g, "");

			return safeValue !== "" ? safeValue : undefined;
		}
	}

	/**
	 * Writes the contents of the current `manifest` to the file specified in `manifestPath`.
	 */
	public writeManifest() {
		const contents = JSON.stringify(this.manifest, undefined, 2 /* spaces */);
		fs.writeFileSync(this.manifestPath, contents);
	}
}

/**
 * Gets the path, specific to the user's operating system, that identifies where Stream Decks plugins are installed.
 * @returns Path to the Stream Deck plugins directory.
 */
export function getOSPluginsPath(): string {
	if (os.platform() === "darwin") {
		return path.join(os.homedir(), "Library/Application Support/com.elgato.StreamDeck/Plugins");
	}

	const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData/Roaming");
	return path.join(appData, "Elgato/StreamDeck/Plugins");
}

/**
 * Determines whether the specified `uuid` is a valid unique-identifier.
 * @param uuid UUID being checked.
 * @returns `true` when the `uuid` represents a valid unique-identifier; otherwise `false`.
 */
export function isValidUUID(uuid: string | undefined): boolean {
	if (uuid === undefined) {
		return false;
	}

	return /^([a-z0-9\-_.]+)$/.test(uuid);
}
