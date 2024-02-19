import type { Layout, Manifest } from "@elgato/schemas/streamdeck/plugins";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { JsonLocation, LocationRef } from "../../common/location";
import { JsonFileContext, JsonSchema } from "../../json";
import { isPredefinedLayoutLike, isValidPluginId } from "../../stream-deck";

const r = createRequire(import.meta.url);
const layoutSchema = r("@elgato/schemas/streamdeck/plugins/layout.json");
const manifestSchema = r("@elgato/schemas/streamdeck/plugins/manifest.json");

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
	const id = basename(path).replace(/\.sdPlugin$/, "");

	return {
		hasValidId: isValidPluginId(id),
		manifest: new ManifestJsonFileContext(join(path, "manifest.json")),
		id
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
		super(path, new JsonSchema<Manifest>(manifestSchema));

		const compiledLayoutSchema = new JsonSchema<Layout>(layoutSchema);
		this.value.Actions?.forEach((action) => {
			if (action.Encoder?.layout !== undefined && !isPredefinedLayoutLike(action.Encoder?.layout.value)) {
				const filePath = resolve(dirname(path), action.Encoder.layout.value);
				this.layoutFiles.push({
					location: action.Encoder.layout.location,
					layout: new JsonFileContext<Layout>(filePath, compiledLayoutSchema)
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
	 * Gets a value indicating whether the {@link id} is valid.
	 */
	readonly hasValidId: boolean;

	/**
	 * Manifest associated with the plugin.
	 */
	readonly manifest: ManifestJsonFileContext;

	/**
	 * Unique identifier parsed from the path to the plugin.
	 */
	readonly id: string;
};
