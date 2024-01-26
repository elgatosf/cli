import { type Manifest } from "@elgato/streamdeck";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JsonObjectMap, JsonSchema, type JsonObject, type JsonSchemaError } from "../../../../common/json";
import { relative } from "../../../../common/path";

/**
 * Provides information about the `manifest.json` file associated with a plugin.
 */
export class ManifestContext {
	/**
	 * Collection of JSON schema validation errors.
	 */
	public readonly errors: ReadonlyArray<JsonSchemaError> = [];

	/**
	 * Map of the parsed manifest JSON data.
	 */
	public readonly jsonMap: JsonObjectMap<Manifest> = new JsonObjectMap<Manifest>();

	/**
	 * Path to the `manifest.json` file; the file may or may not exist.
	 */
	public readonly path: string;

	/**
	 * JSON schema used to validate the manifest.
	 */
	public readonly schema: JsonSchema<Manifest>;

	/**
	 * Initializes a new instance of the {@link ManifestContext} class.
	 * @param path Path to the plugin.
	 */
	constructor(path: string) {
		this.path = join(path, "manifest.json");
		this.schema = new JsonSchema<Manifest>(relative("../node_modules/@elgato/streamdeck/schemas/manifest.json"));

		// Determine if a manifest exists.
		if (!existsSync(this.path)) {
			return;
		}

		const json = readFileSync(this.path, { encoding: "utf-8" });
		({ errors: this.errors, map: this.jsonMap } = this.schema.validate(json));
	}

	/**
	 * Parsed manifest data with all valid value types set, including the location of which the value was parsed within the JSON.
	 * @returns Parsed manifest data.
	 */
	public get value(): JsonObject<Manifest> {
		return this.jsonMap.value;
	}
}
