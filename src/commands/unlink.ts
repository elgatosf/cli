import { unlinkSync } from "node:fs";

import { command } from "../common/command";
import { getPlugins } from "../stream-deck";
import { stop } from "./stop";

/**
 * Unlinks / uninstalls a plugin from Stream Deck's plugin directory.
 */
export const unlink = command<Options>(
	async (options, output) => {
		const plugin = getPlugins().find(({ uuid }) => uuid === options.uuid);
		if (!plugin) {
			return output.error("Plugin not found").log(`No plugin found with UUID: ${options.uuid}`).exit(1);
		}

		if (!plugin.targetPath) {
			if (!options.delete) {
				return output
					.error("Plugin cannot be unlinked")
					.log(`${options.uuid} is not a linked plugin`)
					.log(`To uninstall and delete the plugin, re-run with the delete flag (-d|--delete)`)
					.exit(1);
			}

			// TODO: Stop the plugin and remove it.
			console.log("TODO: Stop the plugin and remove it.");
			return;
		} else {
			// Stop the plugin and remove the link.
			await stop({ quiet: true, uuid: options.uuid });
			unlinkSync(plugin.path);
		}

		output.success("Unlinked successfully");
	},
	{
		delete: false,
	},
);

/**
 * Options for {@link unlink}.
 */
type Options = {
	/**
	 * Enables deleting plugins that are not symbolic-links; default `false`.
	 */
	delete?: boolean;

	/**
	 * Unique-identifier of the plugin to unlink, for example `com.elgato.wave-link`.
	 */
	uuid: string;
};
