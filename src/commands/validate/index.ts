import { resolve } from "node:path";
import { cwd } from "node:process";
import { command } from "../../common/command";
import { validatePlugin } from "./plugin/validate";

/**
 * Validates the given path, and outputs the results.
 */
export const validate = command<ValidateOptions>(
	(options, stdout) => {
		const result = validatePlugin(resolve(options.path));

		result.writeTo(stdout);
		stdout.exit(result.success ? 0 : 1);
	},
	{
		path: cwd()
	}
);

/**
 * Options available to {@link validate}.
 */
type ValidateOptions = {
	/**
	 * Path to the plugin to validate.
	 */
	readonly path?: string;
};