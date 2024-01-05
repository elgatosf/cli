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
	 * Directory name (basename).
	 */
	public readonly directoryName: string;

	/**
	 * Manifest associated with the plugin.
	 */
	public readonly manifest: ManifestContext;

	/**
	 * Unique identifier parsed from the {@link PluginContext.directoryName}.
	 */
	public readonly uuid: string;

	/**
	 * Initializes a new instance of the {@link PluginContext} class.
	 * @param path Path to the plugin.
	 */
	constructor(path: string) {
		this.directoryName = basename(path);
		this.manifest = new ManifestContext(path);
		this.uuid = this.directoryName.replace(/\.sdPlugin$/, "");
	}
}
