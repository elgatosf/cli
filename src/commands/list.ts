import chalk from "chalk";
import { existsSync } from "node:fs";

import { command } from "../common/command";
import { getPlugins } from "../stream-deck";

/**
 * Prints a list of installed plugins
 */
export const list = command(async (options, output) => {
	const plugins = getPlugins();
	for (const { sourcePath, uuid } of plugins) {
		output.log(uuid);
		if (sourcePath) {
			if (existsSync(sourcePath)) {
				console.log(chalk.dim("  └"), chalk.green(sourcePath));
			} else {
				console.log(chalk.dim("  └ Not Found:"), chalk.red(sourcePath));
			}
		}
	}
});
