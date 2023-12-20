import { existsSync, lstatSync } from "fs";
import { rule } from "../../validator";
import type { PluginContext } from "../validate";

/**
 * Validates the path exists, and is a directory.
 */
export const pathIsDirectory = rule<PluginContext>(function () {
	if (!existsSync(this.path)) {
		this.addCritical(this.path, "Path does not exist");
		return;
	}

	if (!lstatSync(this.path).isDirectory()) {
		this.addCritical(this.path, "Path must be a directory");
		return;
	}
});
