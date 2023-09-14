import find from "find-process";
import { Dirent, readdirSync, readlinkSync } from "node:fs";
import os from "node:os";
import { basename, join } from "node:path";

const PLUGIN_SUFFIX = ".sdPlugin";

/**
 * Gets the list of installed plugins.
 * @returns List of plugins, including their path and UUID.
 */
export function getPlugins(): PluginInfo[] {
	return readdirSync(getPluginsPath(), { withFileTypes: true }).reduce<PluginInfo[]>((plugins, entry) => {
		if (entry.isDirectory() || entry.isSymbolicLink()) {
			const uuid = getPluginId(entry.name);
			if (uuid) {
				plugins.push(new PluginInfo(entry, uuid));
			}
		}

		return plugins;
	}, []);
}

/**
 * Gets the installation path of the plugins that Stream Deck will run.
 * @returns The path.
 */
export function getPluginsPath(): string {
	if (os.platform() === "darwin") {
		return join(os.homedir(), "Library/Application Support/com.elgato.StreamDeck/Plugins");
	}

	const appData = process.env.APPDATA ?? join(os.homedir(), "AppData/Roaming");
	return join(appData, "Elgato/StreamDeck/Plugins");
}

/**
 * Determines whether a plugin is installed that matches the specified {@link uuid}.
 * @param uuid Unique-identifier of the plugin to look for.
 * @returns `true` when a plugin was found that matches the {@link uuid}; otherwise `false`.
 */
export function isPluginInstalled(uuid: string): boolean {
	return getPlugins().some((pi) => pi.uuid === uuid);
}

/**
 * Gets the path to the Stream Deck application.
 * @returns The path.
 */
export function getStreamDeckPath(): string {
	if (os.platform() === "darwin") {
		return "/Applications/Elgato Stream Deck.app/Contents/MacOS/Stream Deck";
	} else {
		return "C:\\Program Files\\Elgato\\StreamDeck\\StreamDeck.exe";
	}
}

/**
 * Determines if the Stream Deck application is currently running.
 * @returns `true` when the application is running; otherwise `false`.
 */
export async function isStreamDeckRunning(): Promise<boolean> {
	const appPath = getStreamDeckPath();

	if (os.platform() === "darwin") {
		const processes = await find("name", "Elgato Stream Deck");
		return processes.some((p) => p.cmd.startsWith(appPath));
	} else {
		const processes = await find("name", "StreamDeck.exe");
		return processes.some((p) => p.cmd.startsWith(`"${appPath}"`));
	}
}

/**
 * Attempts to parse the {@link path} to determine the plugin's UUID.
 * @param path Path that represents a plugin; this should end with `.sdPlugin`.
 * @returns The plugin's UUID; otherwise `undefined`.
 */
export function getPluginId(path: string): string | undefined {
	const name = basename(path);
	return name.endsWith(PLUGIN_SUFFIX) ? name.slice(0, -9) : undefined;
}

/**
 * Generates a UUID from the `author` and `name` values. Values are parsed to ensure valid sections, resulting in a complete UUID; when a value cannot be parsed, the resulting UUID is `undefined`.
 * @param author Author of the plugin.
 * @param name Name of the plugin.
 * @returns UUID that represents the plugin, from information found in the manifest.json file; otherwise `undefined`.
 */
export function generatePluginId(author: string | undefined, name: string | undefined): string | undefined {
	const sections = {
		author: formatSection(author),
		name: formatSection(name)
	};

	if (sections.author === undefined || sections.name === undefined) {
		return;
	}

	return `com.${sections.author}.${sections.name}`;

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
 * Determines whether the specified `uuid` is a valid plugin unique-identifier.
 * @param uuid UUID being checked.
 * @returns `true` when the `uuid` represents a valid unique-identifier; otherwise `false`.
 */
export function isValidPluginId(uuid: string | undefined): boolean {
	if (uuid === undefined || uuid === null) {
		return false;
	}

	return /^([a-z0-9\-_.]+)$/.test(uuid);
}

/**
 * Provides information about an installed plugin.
 */
class PluginInfo {
	/**
	 * Path where the plugin is installed.
	 */
	public readonly path;

	/**
	 * Private backing field for {@link PluginInfo.sourcePath}.
	 */
	private _sourcePath: string | null | undefined = undefined;

	/**
	 * Initializes a new instance of the {@link PluginInfo} class.
	 * @param entry The directory entry of the plugin.
	 * @param uuid Unique identifier of the plugin.
	 */
	constructor(private readonly entry: Dirent, public readonly uuid: string) {
		this.path = join(this.entry.path, this.entry.name);
	}

	/**
	 * Gets the source path of the plugin, when the installation path is a symbolic link; otherwise `null`.
	 * @returns The source path; otherwise `null`.
	 */
	public get sourcePath(): string | null {
		if (this._sourcePath === undefined) {
			this._sourcePath = this.entry.isSymbolicLink() ? readlinkSync(this.path) : null;
		}

		return this._sourcePath;
	}
}
