import chalk from "chalk";
import fs from "node:fs";

import i18n from "./i18n/index.js";

/**
 * Exits the process after displaying the specified {@link message}.
 * @param message Message to display prior to existing.
 * @param error Optional error to log before existing.
 */
export function exit(message: string, error?: unknown) {
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

/**
 * Rewrites the file for the given {@link path}. The {@link replacer} is called with the current contents, allowing the caller to optionally replace existing content, or provide new
 * content altogether.
 * @param path Path to the file.
 * @param replacer Function that replaces the current contents.
 */
export function rewriteFile(path: string, replacer: (contents: string) => string): void {
	let contents = fs.readFileSync(path).toString();
	contents = replacer(contents);

	fs.writeFileSync(path, contents);
}

/**
 * Invokes the `task` and displays a spinner whilst it is active; upon completion, a tick is shown.
 * @param name Name of the task being run; this is shown next to the spinner.
 * @param task Task to run.
 */
export async function stdoutSpinner<T = void>(name: string, task: () => Promise<T>) {
	let symbolIndex = 0;
	const symbols = ["|", "/", "-", "\\"];

	const spinner = setInterval(() => {
		write(symbols[symbolIndex]);
		symbolIndex = symbolIndex == symbols.length - 1 ? 0 : symbolIndex + 1;
	}, 150);

	try {
		await task();
		finalize(chalk.green("✔"));
	} catch (err) {
		finalize(chalk.red("✖"));
		exit(i18n.common.taskFailed, err);
	}

	/**
	 * Writes the current message that represents the state of the task.
	 * @param symbol Symbol to denote the state, e.g. spinner frame, tick, etc.
	 */
	function write(symbol: string) {
		process.stdout.clearLine(1);
		process.stdout.cursorTo(0);
		process.stdout.write(`    ${symbol} ${name}`);
	}

	/**
	 * Writes the final message after the task has completed.
	 * @param message Message to write.
	 */
	function finalize(message: string) {
		clearInterval(spinner);
		write(message);
		process.stdout.write("\n");
	}
}
