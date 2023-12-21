import { existsSync } from "node:fs";
import { join } from "node:path";
import { rule } from "../../rule";
import type { PluginContext } from "../validate";

/**
 * Validates the manifest exists.
 */
export const manifestExists = rule<PluginContext>(function () {
	const path = join(this.path, "manifest.json");
	if (!existsSync(path)) {
		this.addCritical(path, "Manifest not found");
	}
});
