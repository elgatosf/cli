import { basename } from "node:path";
import { ManifestContext } from "./manifest";

/**
 * Suffixed associated with a plugin directory.
 */
export const directorySuffix = ".sdPlugin";

/**
 * Provides information about the plugin.
 */
export class PluginContext {
	/**
	 * Manifest associated with the plugin.
	 */
	public readonly manifest: ManifestContext;

	/**
	 * Unique identifier parsed from the {@link PluginContext.pathName}.
	 */
	public readonly uuid: string;

	/**
	 * Initializes a new instance of the {@link PluginContext} class.
	 * @param path Path to the plugin.
	 */
	constructor(path: string) {
		this.manifest = new ManifestContext(path);
		this.uuid = basename(path).replace(/\.sdPlugin$/, "");
	}
}
