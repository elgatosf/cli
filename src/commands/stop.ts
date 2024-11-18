import chalk from "chalk";

import { command } from "../common/command";
import { run } from "../common/runner";
import { getStreamDeckPath, isPluginInstalled, isStreamDeckRunning } from "../stream-deck";

/**
 * Stops the first plugin that matches the given {@link StopOptions.uuid}.
 */
export const stop = command<StopOptions>(async ({ uuid }, output) => {
	output.spin(`Stopping ${uuid}`);

	// Check we have a plugin installed that matches the uuid.
	if (!isPluginInstalled(uuid)) {
		return output.error("Stopping failed").log(`Plugin not found: ${uuid}`).exit(1);
	}

	// When Stream Deck isn't running, warn the user.
	if (!(await isStreamDeckRunning())) {
		return output.info("Stream Deck is not running.").exit();
	}

	// Stop the plugin.
	await run(`"${await getStreamDeckPath()}"`, ["-s", uuid]);
	output.success(`Stopped ${chalk.green(uuid)}`);
});

/**
 * Options available to {@link stop}.
 */
type StopOptions = {
	/**
	 * Identifies the plugin.
	 */
	uuid: string;
};
