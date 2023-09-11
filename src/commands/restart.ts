import chalk from "chalk";

import { run } from "../common/runner";
import { spin } from "../common/spinner";
import { getStreamDeckPath, isPluginInstalled, isStreamDeckRunning } from "../stream-deck";

/**
 * Restarts the first plugin that matches the given {@link uuid}
 * @param uuid Unique-identifier that identifies the plugin.
 * @returns Promise resolved when the command has been executed.
 */
export function restart(uuid: string): Promise<void> {
	return spin(`Restarting ${uuid}`, async ({ info, success, warn }) => {
		// Check we have a plugin installed that matches the uuid.
		if (!isPluginInstalled(uuid)) {
			warn(`Plugin not found ${chalk.yellow(uuid)}`);
			return;
		}

		const appPath = `"${getStreamDeckPath()}"`;

		// When Stream Deck isn't running, start it.
		if (!(await isStreamDeckRunning())) {
			await run(appPath, [], { detached: true, stderr: "ignore" });
			info("Stream Deck is not running. Starting Stream Deck.");
			return;
		}

		// Restart the plugin.
		await run(appPath, ["-r", uuid], { stderr: "ignore" });
		success(`Restarted ${chalk.green(uuid)} successfully`);
	});
}
