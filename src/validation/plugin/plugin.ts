import type { Layout, Manifest } from "@elgato/streamdeck";
import { basename, dirname, join, resolve } from "node:path";
import { JsonLocation, LocationRef } from "../../common/location";
import { relative } from "../../common/path";
import { JsonFileContext, JsonSchema } from "../../json";
import { isPredefinedLayoutLike } from "../../stream-deck";

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

	return {
		uuid,
		manifest: new ManifestJsonFileContext(join(path, "manifest.json"))
	};
}

/**
 * Provides information for a manifest JSON file.
 */
class ManifestJsonFileContext extends JsonFileContext<Manifest> {
	/**
	 * Layout files referenced by the manifest.
	 */
	public readonly layoutFiles: LayoutFile[] = [];

	/**
	 * Initializes a new instance of the {@link ManifestJsonFileContext} class.
	 * @param path Path to the manifest file.
	 */
	constructor(path: string) {
		super(path, new JsonSchema<Manifest>(relative("../node_modules/@elgato/streamdeck/schemas/manifest.json")));

		const layoutSchema = new JsonSchema<Layout>(relative("../node_modules/@elgato/streamdeck/schemas/layout.json"));
		this.value.Actions?.forEach((action) => {
			if (action.Encoder?.layout !== undefined && !isPredefinedLayoutLike(action.Encoder?.layout.value)) {
				const filePath = resolve(dirname(path), action.Encoder.layout.value);
				this.layoutFiles.push({
					location: action.Encoder.layout.location,
					layout: new JsonFileContext<Layout>(filePath, layoutSchema)
				});
			}
		});
	}
}

/**
 * Provides a reference to a layout file defined within the manifest.
 */
export type LayoutFile = LocationRef<JsonLocation> & {
	/**
	 * Context of the layout JSON file.
	 */
	layout: JsonFileContext<Layout>;
};

/**
 * Provides information about the plugin.
 */
export type PluginContext = {
	/**
	 * Manifest associated with the plugin.
	 */
	readonly manifest: ManifestJsonFileContext;

	/**
	 * Unique identifier parsed from the path to the plugin.
	 */
	readonly uuid: string;
};
