import { existsSync } from "node:fs";
import { join } from "node:path";
import { rule } from "../../rule";
import type { PluginContext } from "../validate";

/**
 * Validates the manifest exists.
 */
export const manifestExists = rule<PluginContext>(function (plugin: PluginContext) {
	plugin.manifest.path = join(this.path, "manifest.json");

	if (!existsSync(plugin.manifest.path)) {
		this.addCritical(plugin.manifest.path, "Manifest not found");
	}
});
