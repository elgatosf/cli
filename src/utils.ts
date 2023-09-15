import chalk from "chalk";

/**
 * Exits the process after displaying the specified {@link message}.
 * @param message Message to display prior to existing.
 * @param error Optional error to log before existing.
 */
export function exit(message: string, error?: unknown): void {
	if (error) {
		console.log(chalk.red(message));
	} else {
		console.log(message);
	}

	if (error instanceof Error) {
		if (error.message) {
			console.log(chalk.yellow(error.message));
		}
		if (error.stack) {
			console.log(error.stack);
		}
	}

	process.exit(error ? 1 : 0);
}
