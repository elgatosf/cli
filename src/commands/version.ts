import { existsSync, readFileSync } from "node:fs";
import { command } from "../common/command";
import { relative } from "../common/path";

/**
 * Prints the current version of the CLI.
 */
export const cliVersion = command(async (options, stdout) => {
	try {
		const contents = readFileSync(relative("../package.json"), { encoding: "utf8" });
		const version = `v${JSON.parse(contents).version}`;

		if (existsSync(relative("../src"))) {
			stdout.log(`${version} (dev)`);
		} else {
			stdout.log(version);
		}
	} catch (e) {
		stdout.error(`Failed to read CLI version`).log(e).exit(1);
	}
});
