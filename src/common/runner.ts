import child_process, { SpawnOptionsWithoutStdio, StdioNull } from "node:child_process";

/**
 * Runs the specified {@link command} with the give {@link args}.
 * @param command Command to run.
 * @param args Supporting arguments to be supplied to the {@link command}.
 * @param options Options used to determine how the {@link command} should be run.
 * @returns The result of running the command. **NB.** when the command is detached, the result is always 0.
 */
export function run(command: string, args: string[], options?: RunOptions): Promise<number> {
	options = {
		...{
			shell: true,
			stdio: ["ignore", "ignore", options?.stderr || "inherit"],
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
 * Defines the options that support running a command via {@link run}.
 */
export type RunOptions = Omit<SpawnOptionsWithoutStdio, "stdio"> & {
	/**
	 * Optional standard error stream; by default the standard error will be output to the default stream.
	 */
	stderr?: StdioNull;
};
