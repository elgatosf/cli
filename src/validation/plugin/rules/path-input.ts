import { existsSync, lstatSync } from "node:fs";
import { basename } from "node:path";
import { isValidPluginId } from "../../../stream-deck";
import { rule } from "../../rule";
import { directorySuffix, type PluginContext } from "../plugin";

export const pathIsDirectoryAndUuid = rule<PluginContext>(function (plugin: PluginContext) {
	const name = basename(this.path);

	if (!existsSync(this.path)) {
		this.addError(this.path, "Path does not exist");
	} else if (!lstatSync(this.path).isDirectory()) {
		this.addError(this.path, "Path must be a directory");
	}

	if (!name.endsWith(directorySuffix)) {
		this.addError(this.path, "Name must be suffixed with '.sdPlugin'");
	}

	if (!isValidPluginId(plugin.uuid)) {
		this.addError(this.path, "Name must be in reverse DNS format, and must only contain lowercase alphanumeric characters (a-z, 0-9), hyphens (-), and periods (.)", {
			suggestion: "Example: 'com.elgato.wave-link'"
		});
	}
});
