import { rule } from "../../rule";
import { type PluginContext } from "../contexts/plugin";

import { existsSync } from "node:fs";

/**
 * Validates the JSON schema of the manifest.
 */
export const manifestExistsAndSchemaIsValid = rule<PluginContext>(function (plugin: PluginContext) {
	if (!existsSync(plugin.manifest.path)) {
		this.addError(plugin.manifest.path, "Manifest not found");
	}

	plugin.manifest.errors.forEach(({ message, location }) => {
		this.addError(plugin.manifest.path, message, { location });
	});
});
