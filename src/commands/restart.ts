import chalk from "chalk";
import { basename, dirname } from "path";

import { getStreamDeckPath, isPluginInstalled, isStreamDeckRunning } from "../stream-deck";
import { run } from "../utils";

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

	// When Stream Deck isn't running, start it.
	if (!(await isStreamDeckRunning())) {
		console.log(chalk.yellow("Stream Deck is not running. Starting Stream Deck."));
		await run(`"${getStreamDeckPath()}"`, [], { detached: true });
		return;
	}

	// Restart the plugin.
	const appPath = getStreamDeckPath();
	await run(basename(appPath), ["-r", uuid], {
		cwd: dirname(appPath)
	});

	console.log(chalk.green(`Successfully restarted ${uuid}`));
}
