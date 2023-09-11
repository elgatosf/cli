import child_process, { ChildProcessByStdio, SpawnOptionsWithStdioTuple, StdioNull, StdioPipe } from "node:child_process";
import { Readable } from "node:stream";

/**
 * Runs the specified {@link command} with the give {@link args}.
 * @param command Command to run.
 * @param args Supporting arguments to be supplied to the {@link command}.
 * @param options Options used to determine how the {@link command} should be run.
 * @returns The result of running the command. **NB.** when the command is detached, the result is always 0.
 */
export function run(command: string, args: string[], options?: RunOptions): Promise<number> {
	const opts: SpawnOptionsWithStdioTuple<StdioNull, StdioNull, StdioPipe> = {
		...{
			shell: true,
			windowsHide: true
		},
		...options,
		...{
			stdio: ["ignore", "ignore", "pipe"]
		}
	};

	return new Promise((resolve, reject) => {
		const child = child_process.spawn(command, args, opts);

		// When the process is detached, we can't monitor the result, so return success
		if (options?.detached) {
			child.unref();
			resolve(0);
			return;
		}

		// Begin gathering the stderr in the event we receive an error code.
		const stderr = stderrReader(child);
		child.on("exit", (code: number) => {
			if (code > 0) {
				stderr.then((value) => {
					console.log(value);
					reject(code);
				});
			} else {
				resolve(0);
			}
		});
	});
}

/**
 * Reads the stderr to a buffer, and resolves the promise once it closes.
 * @param process The process whose stderr should be monitored.
 * @returns Buffered stderr as a string.
 */
async function stderrReader(process: ChildProcessByStdio<null, null, Readable>): Promise<string> {
	return new Promise((resolve) => {
		let stderr: ReadonlyArray<Uint8Array> = [];
		process.stderr.on("data", (data) => (stderr = stderr.concat(data)));
		process.stderr.once("close", () => resolve(Buffer.concat(stderr).toString()));
	});
}

/**
 * Defines the options that support running a command via {@link run}.
 */
export type RunOptions = Omit<SpawnOptionsWithStdioTuple<StdioNull, StdioNull, Readable>, "stdio">;
