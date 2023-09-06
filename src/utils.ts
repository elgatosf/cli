import chalk from "chalk";
import child_process, { SpawnOptionsWithoutStdio } from "node:child_process";

import i18n from "./i18n/index.js";

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

/**
 * Runs the specified {@link command} with the give {@link args}.
 * @param command Command to run.
 * @param args Supporting arguments to be supplied to the {@link command}.
 * @param options Options used to determine how the {@link command} should be run.
 * @returns The result of running the command. **NB.** when the command is detached, the result is always 0.
 */
export function run(command: string, args: string[], options?: Omit<SpawnOptionsWithoutStdio, "stdio">): Promise<number> {
	options = {
		...{
			shell: true,
			stdio: ["ignore", "ignore", "inherit"], // Ignore everything apart from stderr.
			windowsHide: true
		},
		...options
	};

	return new Promise((resolve, reject) => {
		const child = child_process.spawn(command, args, options);

		if (options?.detached) {
			child.unref();
			resolve(0);
		} else {
			child
				.on("message", (msg) => console.log(msg))
				.on("error", (err) => console.log(err))
				.on("exit", (code: number) => {
					if (code > 0) {
						reject(code);
					} else {
						resolve(0);
					}
				});
		}
	});
}

/**
 * Invokes the `task` and displays a spinner whilst it is active; upon completion, a tick is shown.
 * @param name Name of the task being run; this is shown next to the spinner.
 * @param task Task to run.
 */
export async function stdoutSpinner<T = void>(name: string, task: () => Promise<T> | T): Promise<void> {
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
	function write(symbol: string): void {
		process.stdout.clearLine(1);
		process.stdout.cursorTo(0);
		process.stdout.write(`    ${symbol} ${name}`);
	}

	/**
	 * Writes the final message after the task has completed.
	 * @param message Message to write.
	 */
	function finalize(message: string): void {
		clearInterval(spinner);
		write(message);
		process.stdout.write("\n");
	}
}
