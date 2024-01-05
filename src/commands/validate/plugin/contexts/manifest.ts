import { type Manifest } from "@elgato/streamdeck";
import Ajv, { type AnySchema } from "ajv";
import { type IOutputError } from "better-ajv-errors";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validate, type JsonObject } from "../../../../common/json";
import { relative } from "../../../../common/path";

/**
 * Provides information about the `manifest.json` file associated with a plugin.
 */
export class ManifestContext {
	/**
	 * Collection of JSON schema validation errors.
	 */
	public readonly errors: ReadonlyArray<IOutputError> = [];

	/**
	 * Parsed manifest data with all valid value types set, including the location of which the value was parsed within the JSON.
	 */
	public readonly manifest: JsonObject<Manifest> = {};

	/**
	 * Path to the `manifest.json` file; the file may or may not exist.
	 */
	public readonly path: string;

	/**
	 * JSON schema responsible for validating the `manifest.json` file.
	 */
	private readonly schema: AnySchema = ManifestContext.getSchema();

	/**
	 * Initializes a new instance of the {@link ManifestContext} class.
	 * @param root Root directory where the plugin is located.
	 */
	constructor(root: string) {
		// Determine if a manifest exists.
		this.path = join(root, "manifest.json");
		if (!existsSync(this.path)) {
			return;
		}

		// Read the contents of the JSON, and validate it against the schema.
		const json = readFileSync(this.path, { encoding: "utf-8" });
		const ajv = new Ajv({ allErrors: true });
		ajv.addKeyword("markdownDescription");

		({ errors: this.errors, value: this.manifest } = validate<Manifest>(json, ajv.compile<Manifest>(this.schema)));
	}

	/**
	 * Gets the JSON schema used to validate the plugin's `manifest.json` file.
	 * @returns The JSON schema.
	 */
	private static getSchema(): AnySchema {
		try {
			const path = relative("../node_modules/@elgato/streamdeck/schemas/manifest.json");
			return JSON.parse(readFileSync(path, { encoding: "utf-8" }));
		} catch (cause) {
			throw new Error("Failed to parse manifest JSON schema", { cause });
		}
	}
}
