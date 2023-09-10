import chalk from "chalk";

import { run } from "../common/runner";
import { getStreamDeckPath, isPluginInstalled, isStreamDeckRunning } from "../stream-deck";

/**
 * Restarts the first plugin that matches the given {@link uuid}
 * @param uuid Unique-identifier that identifies the plugin.
 * @returns Promise resolved when the command has been executed.
 */
export async function restart(uuid: string): Promise<void> {
	// Check we have a plugin installed that matches the uuid.
	if (!isPluginInstalled(uuid)) {
		console.log(`No plugin found matching ${chalk.yellow(uuid)}`);
		return;
	}

	const appPath = `"${getStreamDeckPath()}"`;

	// When Stream Deck isn't running, start it.
	if (!(await isStreamDeckRunning())) {
		await run(appPath, [], { detached: true, stderr: "ignore" });
		console.log(chalk.yellow("Stream Deck is not running. Starting Stream Deck."));
		return;
	}

	// Restart the plugin.
	await run(appPath, ["-r", uuid], { stderr: "ignore" });
	console.log(chalk.green(`Successfully restarted ${uuid}`));
}
