import chalk from "chalk";

import { command } from "../common/command";
import { run } from "../common/runner";
import { getStreamDeckPath, isPluginInstalled, isStreamDeckRunning } from "../stream-deck";

/**
 * Restarts the first plugin that matches the given {@link RestartOptions.uuid}.
 */
export const restart = command<RestartOptions>(async ({ uuid }, output) => {
	output.spin(`Restarting ${uuid}`);

	// Check we have a plugin installed that matches the uuid.
	if (!isPluginInstalled(uuid)) {
		return output.error("Restarting failed").log(`Plugin not found: ${uuid}`).exit(1);
	}

	const appPath = `"${getStreamDeckPath()}"`;

	// When Stream Deck isn't running, start it.
	if (!(await isStreamDeckRunning())) {
		await run(appPath, [], { detached: true });
		return output.info("Stream Deck is not running. Starting Stream Deck.").exit();
	}

	// Restart the plugin.
	await run(appPath, ["-r", uuid]);
	output.success(`Restarted ${chalk.green(uuid)}`);
});

/**
 * Options available to {@link restart}.
 */
type RestartOptions = {
	/**
	 * Identifies the plugin.
	 */
	uuid: string;
};
