import { existsSync, lstatSync } from "fs";
import { basename } from "path";
import { isValidPluginId } from "../../../../stream-deck";
import { rule } from "../../validator";
import type { PluginContext } from "../validate";

/**
 * Validates the path exists, and represents a valid plugin identifier.
 */
export default rule<PluginContext>(function () {
	if (!existsSync(this.path)) {
		this.addCritical(this.path, "Path does not exist");
		return;
	}

	if (!lstatSync(this.path).isDirectory()) {
		this.addCritical(this.path, "Path must be a directory");
		return;
	}

	const dir = basename(this.path);
	let idLength = dir.length - 9;

	if (!dir.endsWith(".sdPlugin")) {
		this.addError(this.path, "Invalid directory name", `Directory name must be suffixed with ".sdPlugin".`);
		idLength = 0;
	}

	if (!isValidPluginId(dir.substring(0, idLength))) {
		this.addError(this.path, "Invalid directory name", "Directory name must only contain lowercase alphanumeric characters (a-z, 0-9), hyphens (-), underscores (_), and periods (.).");
	}
});
