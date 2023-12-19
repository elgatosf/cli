import chalk from "chalk";
import { cwd } from "node:process";
import { command } from "../../common/command";
import { validatePlugin } from "./plugin/validate";

/**
 * Validates the given path, and outputs the results.
 */
export const validate = command<ValidateOptions>(
	(options, stdout) => {
		const result = validatePlugin(options.path);

		writeResults();
		finalize();

		/**
		 * Writes the results of validation.
		 */
		function writeResults(): void {
			if (result.size === 0) {
				return;
			}

			stdout.log("Validation summary:").log();
			result.forEach((entries, path) => {
				stdout.log(`${chalk.underline(path)}`);
				entries.forEach(({ severity, message, fix }) => {
					if (severity === "error") {
						stdout.log(`  ${chalk.red("error".padEnd(9))} ${message}`);
					} else {
						stdout.log(`  ${chalk.yellow("warning".padEnd(9))} ${message}`);
					}

					if (fix) {
						stdout.log(`${" ".repeat(12)}${chalk.gray(fix)}`);
					}
				});
			});

			stdout.log();
		}

		/**
		 * Finalizes the validation, writing the summary and returning the output number.
		 * @returns Exits the command with the success code.
		 */
		function finalize(): never | void {
			// Validation was successful.
			const getCount = (count: number, type: string): string => `${count} ${count === 1 ? type : `${type}s`}`;
			if (result.errorCount === 0 && result.warningCount === 0) {
				stdout.success("Validation successful");
				return;
			}

			// Only errors.
			if (result.warningCount === 0) {
				return stdout.error(`Failed with ${getCount(result.errorCount, "error")}`).exit(1);
			}

			// Only warnings.
			if (result.errorCount === 0) {
				stdout.warn(getCount(result.warningCount, "warning"));
				return;
			}

			// Both errors and warnings.
			return stdout.error(`${getCount(result.errorCount + result.warningCount, "problem")} (${getCount(result.errorCount, "error")}, ${getCount(result.warningCount, "warning")})`).exit(1);
		}
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
