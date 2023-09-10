import chalk from "chalk";

import { run } from "../common/runner";
import { getStreamDeckPath, isPluginInstalled, isStreamDeckRunning } from "../stream-deck";

/**
 * Stops the first plugin that matches the given {@link uuid}
 * @param uuid Unique-identifier that identifies the plugin.
 * @returns Promise resolved when the command has been executed.
 */
export async function stop(uuid: string): Promise<void> {
	// Check we have a plugin installed that matches the uuid.
	if (!isPluginInstalled(uuid)) {
		console.log(`No plugin found matching ${chalk.yellow(uuid)}`);
		return;
	}

	// When Stream Deck isn't running, warn the user.
	if (!(await isStreamDeckRunning())) {
		console.log(chalk.yellow("Stream Deck is not running."));
		return;
	}

	// Stop the plugin.
	await run(`"${getStreamDeckPath()}"`, ["-s", uuid], { stderr: "ignore" });
	console.log(chalk.green(`Successfully stopped ${uuid}`));
}
