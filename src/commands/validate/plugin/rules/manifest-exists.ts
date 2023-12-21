import { existsSync } from "node:fs";
import { join } from "node:path";
import { rule } from "../../rule";
import type { PluginContext } from "../validate";

/**
 * Validates the manifest exists.
 */
export const manifestExists = rule<PluginContext>(function () {
	this.manifest.path = join(this.path, "manifest.json");

	if (!existsSync(this.manifest.path)) {
		this.addCritical(this.manifest.path, "Manifest not found");
	}
});
