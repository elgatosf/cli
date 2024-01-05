import { basename } from "path";
import { isValidPluginId } from "../../../../stream-deck";
import { rule } from "../../rule";
import { directorySuffix, type PluginContext } from "../contexts/plugin";

/**
 * Validates the path directory name represents a plugin identifier.
 */
export const directoryNameIsIdentifier = rule<PluginContext>(function (plugin) {
	if (!basename(this.path).endsWith(directorySuffix)) {
		this.addError(this.path, "Invalid directory name", { suggestion: `Directory name must be suffixed with ".sdPlugin"` });
	}

	if (!isValidPluginId(plugin.uuid)) {
		this.addError(this.path, "Invalid directory name", { suggestion: "Directory name must only contain lowercase alphanumeric characters (a-z, 0-9), hyphens (-), underscores (_), and periods (.)" });
	}
});
