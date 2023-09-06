import find from "find-process";
import { Dirent, readdirSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";

/**
 * Gets the list of installed plugins.
 * @returns List of plugins, including their path and UUID.
 */
export function getPlugins(): PluginInfo[] {
	return readdirSync(getPluginsPath(), { withFileTypes: true })
		.filter((value: Dirent) => value.isDirectory() && value.name.endsWith(".sdPlugin"))
		.map((value) => {
			return {
				path: value.path,
				uuid: value.name.slice(0, -9)
			};
		});
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
		throw new Error("macOS coming soon.");
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
		throw new Error("macOS coming soon.");
	} else {
		const processes = await find("name", "StreamDeck.exe");
		return processes.some((p) => p.cmd.startsWith(`"${appPath}"`));
	}
}

/**
 * Provides information about an installed plugin.
 */
type PluginInfo = {
	/**
	 * Path to the plugin.
	 */
	path: string;

	/**
	 * Unique-identifier of the plugin.
	 */
	uuid: string;
};
