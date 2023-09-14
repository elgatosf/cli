import chalk from "chalk";

import { command } from "../common/command";
import { run } from "../common/runner";
import { getStreamDeckPath, isPluginInstalled, isStreamDeckRunning } from "../stream-deck";

/**
 * Stops the first plugin that matches the given {@link StopOptions.uuid}.
 */
export const stop = command<StopOptions>(async ({ uuid }, feedback) => {
	feedback.spin(`Stopping ${uuid}`);

	// Check we have a plugin installed that matches the uuid.
	if (!isPluginInstalled(uuid)) {
		return feedback.error("Stopping failed").log(`Plugin not found: ${uuid}`).exit(1);
	}

	// When Stream Deck isn't running, warn the user.
	if (!(await isStreamDeckRunning())) {
		return feedback.info("Stream Deck is not running.");
	}

	// Stop the plugin.
	await run(`"${getStreamDeckPath()}"`, ["-s", uuid]);
	feedback.success(`Stopped ${chalk.green(uuid)}`);
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
