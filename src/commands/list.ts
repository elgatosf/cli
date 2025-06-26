import chalk from "chalk";
import { existsSync } from "node:fs";

import { command } from "../common/command";
import { getPlugins } from "../stream-deck";

/**
 * Prints a list of installed plugins
 */
export const list = command(async (options, output) => {
	const plugins = getPlugins();
	for (const { targetPath, uuid } of plugins) {
		output.log(uuid);
		if (targetPath) {
			if (existsSync(targetPath)) {
				console.log(chalk.dim("  └"), chalk.green(targetPath));
			} else {
				console.log(chalk.dim("  └ Not Found:"), chalk.red(targetPath));
			}
		}
	}
});
