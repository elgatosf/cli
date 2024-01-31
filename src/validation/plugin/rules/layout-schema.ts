import { rule } from "../../rule";
import { type PluginContext } from "../plugin";

import { existsSync } from "node:fs";

/**
 * Validate the layout files referenced in the manifest exist, and log any JSON schema errors that were encountered when validating their content.
 */
export const layoutsExistAndSchemasAreValid = rule<PluginContext>(function (plugin: PluginContext) {
	// Validate the layout files exist.
	plugin.manifest.layoutFiles.forEach(({ layout, location }) => {
		if (!existsSync(layout.path)) {
			this.addError(plugin.manifest.path, "layout not found", { location });
		}
	});

	// Add their JSON schema errors.
	plugin.manifest.layoutFiles.forEach(({ layout: layout }) => {
		layout.errors.forEach(({ message, location }) => {
			this.addError(layout.path, message, { location });
		});
	});
});
