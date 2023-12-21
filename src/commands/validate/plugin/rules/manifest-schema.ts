import { rule } from "../../rule";
import type { PluginContext } from "../validate";

import { type Manifest } from "@elgato/streamdeck";
import Ajv, { AnySchema, ErrorObject } from "ajv";
import betterAjvErrors from "better-ajv-errors";
import { readFileSync } from "node:fs";
import { relative } from "../../../../common/path";

/**
 * Validates the JSON schema of the manifest.
 */
export const manifestSchema = rule<PluginContext>(function () {
	if (this.manifest.path === undefined) {
		throw new Error("Validating the manifest schema requires a manifest file");
	}

	const json = readFileSync(this.manifest.path, { encoding: "utf-8" });

	// Attempt to load the manifest data from the file contents.
	let manifest: Manifest | undefined = undefined;
	try {
		manifest = JSON.parse(json);
	} catch {
		this.addCritical(this.manifest.path, "Failed to parse manifest");
		return;
	}

	// Build the schema used to validate the manifest.
	const ajv = new Ajv({ allErrors: true });
	ajv.addKeyword("markdownDescription");
	const schema = getSchema();
	const validate = ajv.compile(schema);

	// Validate the manifest.
	const valid = validate(manifest);
	if (!valid) {
		betterAjvErrors(schema, manifest, validate.errors as Array<ErrorObject>, { format: "js", json }).forEach(({ error, start }) => {
			this.addError(this.manifest.path!, error.trim(), { position: start });
		});
	}

	// Set the manifest to allow for chaining.
	this.manifest.value = manifest;
});

/**
 * Gets the schema responsible for validating the manifest JSON.
 * @returns The schema.
 */
function getSchema(): AnySchema {
	const path = relative("../node_modules/@elgato/streamdeck/schemas/manifest.json");
	return JSON.parse(readFileSync(path, { encoding: "utf-8" }));
}
