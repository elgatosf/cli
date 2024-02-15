import { resolve } from "node:path";
import { cwd } from "node:process";
import { command } from "../common/command";
import { store } from "../common/storage";
import { packageManager } from "../package-manager";
import { validatePlugin } from "../validation/plugin";

/**
 * Key within the store for the value that records the last update check.
 */
const LAST_UPDATE_CHECK_STORE_KEY = "validateSchemasLastUpdateCheck";

/**
 * Validates the given path, and outputs the results.
 */
export const validate = command<ValidateOptions>(
	async (options, stdout) => {
		// Determine whether the schemas should be updated.
		if (canUpdateCheck(options)) {
			const update = await packageManager.checkUpdate("@elgato/schemas");
			if (update) {
				await stdout.spin("Updating validation rules", async () => {
					await packageManager.install(update);
					stdout.info(`Validation rules updated`);
				});
			}

			// Log the update check.
			store.set(LAST_UPDATE_CHECK_STORE_KEY, new Date());
		}

		// Validate the plugin, and log the result.
		const result = await validatePlugin(resolve(options.path));
		result.writeTo(stdout);
		stdout.exit(result.success ? 0 : 1);
	},
	{
		forceUpdateCheck: false,
		path: cwd(),
		updateCheck: true
	}
);

/**
 * Determines whether an update check can occur for the JSON schemas used to validate files.
 * @param opts Command line options provided when executing the validate command.
 * @returns `true` when an update check can occur; otherwise `false`.
 */
function canUpdateCheck(opts: Required<ValidateOptions>): boolean {
	// Force an update check.
	if (opts.forceUpdateCheck) {
		return true;
	}

	// Prevent an update check.
	if (!opts.updateCheck) {
		return false;
	}

	// Read the store to determine when the last schema update check occurred.
	const prev = store.get(LAST_UPDATE_CHECK_STORE_KEY);
	if (prev === undefined || typeof prev !== "string") {
		return true;
	}

	// Crudely check if the current date differs to the last update check.
	return new Date().toDateString() !== new Date(prev).toDateString();
}

/**
 * Options available to {@link validate}.
 */
type ValidateOptions = {
	/**
	 * Determines whether an update check **must** happen.
	 */
	readonly forceUpdateCheck?: boolean;

	/**
	 * Path to the plugin to validate.
	 */
	readonly path?: string;

	/**
	 * Determines whether an update check can occur.
	 */
	readonly updateCheck?: boolean;
};
