import chalk from "chalk";

import { spin } from "../common/feedback";
import { run } from "../common/runner";
import { getStreamDeckPath, isPluginInstalled, isStreamDeckRunning } from "../stream-deck";

/**
 * Stops the first plugin that matches the given {@link uuid}
 * @param uuid Unique-identifier that identifies the plugin.
 * @returns Promise resolved when the command has been executed.
 */
export function stop(uuid: string): Promise<void> {
	return spin(`Stopping ${uuid}`, async ({ info, success, warn }) => {
		// Check we have a plugin installed that matches the uuid.
		if (!isPluginInstalled(uuid)) {
			warn(`Plugin not found ${chalk.yellow(uuid)}`);
			return;
		}

		// When Stream Deck isn't running, warn the user.
		if (!(await isStreamDeckRunning())) {
			info("Stream Deck is not running.");
			return;
		}

		// Stop the plugin.
		await run(`"${getStreamDeckPath()}"`, ["-s", uuid]);
		success(`Stopped ${chalk.green(uuid)}`);
	});
}
