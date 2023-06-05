//import chalk from "chalk";
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
		this.manifest = JSON.parse(fs.readFileSync(this.manifestPath).toString());
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
