import chalk from "chalk";
import { lstatSync, symlinkSync } from "node:fs";
import { basename, resolve } from "node:path";

import { command } from "../common/command";
import { getPluginId, getPlugins, getPluginsPath } from "../stream-deck";

/**
 * Attempts to create a symbolic-link for the given path within the Stream Deck plugin's folder; this will effectively install the plugin to Stream Deck.
 */
export const link = command<LinkOptions>(
	(options, feedback) => {
		feedback.spin("Linking plugin");

		// Validate the path is a directory that exists.
		if (lstatSync(options.path, { throwIfNoEntry: false })?.isDirectory() !== true) {
			return feedback
				.error("Linking failed")
				.log(`Directory not found: ${basename(options.path)}`)
				.exit();
		}

		// Validate the directory name is the correct format.
		const uuid = getPluginId(options.path);
		if (uuid === undefined) {
			return feedback
				.error("Linking failed")
				.log(`Invalid directory name: ${basename(options.path)}`)
				.log(
					'Name should represent a reverse DNS format and have a suffix of ".sdPlugin". Name must only contain lowercase alphanumeric characters (a-z, 0-9), hyphens (-), underscores (_), and periods (.).'
				)
				.log(`Examples: ${chalk.green("com.elgato.wave-link.sdPlugin")}, ${chalk.green("tv.twitch.studio.sdPlugin")}`)
				.exit();
		}

		// Check if there is a conflict with an already installed plugin.
		const existing = getPlugins().find((p) => p.uuid === uuid);
		if (existing) {
			if (existing.sourcePath !== null && resolve(existing.sourcePath) === resolve(options.path)) {
				return feedback.success("Linked successfully");
			} else {
				return feedback
					.error("Linking failed")
					.log(`Plugin already installed: ${uuid}`)
					.log(`Another plugin with this identifier is already installed. Please uninstall the plugin, or rename the directory being linked, and try again.`)
					.exit();
			}
		}

		symlinkSync(resolve(options.path), resolve(getPluginsPath(), basename(options.path)), "junction");
		return feedback.success("Linked successfully");
	},
	{
		path: process.cwd()
	}
);

/**
 * Options available to {@link link}.
 */
type LinkOptions = {
	/**
	 * Path to the plugin.
	 */
	path?: string;
};
