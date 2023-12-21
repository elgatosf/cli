import { basename } from "path";
import { isValidPluginId } from "../../../../stream-deck";
import { rule } from "../../rule";
import type { PluginContext } from "../validate";

/**
 * Validates the path directory name represents a plugin identifier.
 */
export const directoryNameIsIdentifier = rule<PluginContext>(function () {
	const dir = basename(this.path);
	let idLength = dir.length - 9;

	if (!dir.endsWith(".sdPlugin")) {
		this.addError(this.path, "Invalid directory name", { suggestion: `Directory name must be suffixed with ".sdPlugin".` });
		idLength = 0;
	}

	if (!isValidPluginId(dir.substring(0, idLength))) {
		this.addError(this.path, "Invalid directory name", { suggestion: "Directory name must only contain lowercase alphanumeric characters (a-z, 0-9), hyphens (-), underscores (_), and periods (.)." });
	}
});
