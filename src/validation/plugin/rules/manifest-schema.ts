import { rule } from "../../rule";
import { type PluginContext } from "../plugin";

import { existsSync } from "node:fs";

/**
 * Validates the JSON schema of the manifest; this validation fulfils the same role as if the JSON were validated in an IDE, i.e. custom keyword validation is not applied.
 */
export const manifestExistsAndSchemaIsValid = rule<PluginContext>(function (plugin: PluginContext) {
	if (!existsSync(plugin.manifest.path)) {
		this.addError(plugin.manifest.path, "Manifest not found");
	}

	plugin.manifest.errors.forEach(({ message, location }) => {
		this.addError(plugin.manifest.path, message, { location });
	});
});
