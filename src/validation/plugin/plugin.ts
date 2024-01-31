import type { Manifest } from "@elgato/streamdeck";
import { basename, join } from "node:path";
import { relative } from "../../common/path";
import { JsonFileContext, JsonSchema } from "../../json";

/**
 * Suffixed associated with a plugin directory.
 */
export const directorySuffix = ".sdPlugin";

/**
 * Creates a context that represents the plugin.
 * @param path Plugin directory.
 * @returns Plugin context.
 */
export function createContext(path: string): PluginContext {
	const uuid = basename(path).replace(/\.sdPlugin$/, "");
	const manifest = createManifestContext(path);

	return {
		uuid,
		manifest
	};
}

/**
 * Creates a context that represents the plugin's manifest.
 * @param root Plugin directory.
 * @returns Manifest context.
 */
function createManifestContext(root: string): JsonFileContext<Manifest> {
	const path = join(root, "manifest.json");
	const schema = new JsonSchema<Manifest>(relative("../node_modules/@elgato/streamdeck/schemas/manifest.json"));

	return new JsonFileContext(path, schema);
}

/**
 * Provides information about the plugin.
 */
export type PluginContext = {
	/**
	 * Manifest associated with the plugin.
	 */
	readonly manifest: JsonFileContext<Manifest>;

	/**
	 * Unique identifier parsed from the path to the plugin.
	 */
	readonly uuid: string;
};
