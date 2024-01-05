import { existsSync, lstatSync } from "fs";
import { rule } from "../../rule";
import { type PluginContext } from "../contexts/plugin";

/**
 * Validates the path exists, and is a directory.
 */
export const pathIsDirectory = rule<PluginContext>(function () {
	if (!existsSync(this.path)) {
		this.addError(this.path, "Path does not exist");
		return;
	}

	if (!lstatSync(this.path).isDirectory()) {
		this.addError(this.path, "Path must be a directory");
		return;
	}
});
