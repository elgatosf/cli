import { rule } from "../../rule";
import type { PluginContext } from "../validate";

import { parse } from "@humanwhocodes/momoa";
import Ajv, { AnySchema, ErrorObject } from "ajv";
import betterAjvErrors from "better-ajv-errors";
import { readFileSync } from "node:fs";
import { relative } from "../../../../common/path";

/**
 * Validates the JSON schema of the manifest.
 */
export const manifestSchema = rule<PluginContext>(function () {
	if (this.manifest.path === undefined) {
		throw new Error("Validating the manifest schema requires the manifest file");
	}

	// Attempt to load the manifest data from the file contents.
	try {
		this.manifest.json = readFileSync(this.manifest.path, { encoding: "utf-8" });
		this.manifest.value = JSON.parse(this.manifest.json);
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
	const valid = validate(this.manifest.value);
	if (!valid) {
		betterAjvErrors(schema, this.manifest.value, validate.errors as Array<ErrorObject>, { format: "js", json: this.manifest.json }).forEach(({ error, start }) => {
			this.addError(this.manifest.path!, error.trim(), { position: start });
		});
	}

	this.manifest.jsonAst = parse(this.manifest.json);
});

/**
 * Gets the schema responsible for validating the manifest JSON.
 * @returns The schema.
 */
function getSchema(): AnySchema {
	const path = relative("../node_modules/@elgato/streamdeck/schemas/manifest.json");
	return JSON.parse(readFileSync(path, { encoding: "utf-8" }));
}
