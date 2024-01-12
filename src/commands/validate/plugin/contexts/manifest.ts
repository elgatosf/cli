import { type Manifest } from "@elgato/streamdeck";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JsonSchema, type JsonObject, type JsonSchemaError } from "../../../../common/json";
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
	 * Parsed manifest data with all valid value types set, including the location of which the value was parsed within the JSON.
	 */
	public readonly manifest: JsonObject<Manifest> = {};

	/**
	 * Path to the `manifest.json` file; the file may or may not exist.
	 */
	public readonly path: string;

	/**
	 * Initializes a new instance of the {@link ManifestContext} class.
	 * @param path Path to the plugin.
	 */
	constructor(path: string) {
		// Determine if a manifest exists.
		this.path = join(path, "manifest.json");
		if (!existsSync(this.path)) {
			return;
		}

		const json = readFileSync(this.path, { encoding: "utf-8" });
		const schema = new JsonSchema<Manifest>(relative("../node_modules/@elgato/streamdeck/schemas/manifest.json"));

		({ errors: this.errors, value: this.manifest } = schema.validate(json));
	}
}
