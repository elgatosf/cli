import { rule } from "../../rule";
import { PluginContext } from "../validate";

import { parse } from "@humanwhocodes/momoa";
import Ajv, { AnySchema, ErrorObject } from "ajv";
import betterAjvErrors from "better-ajv-errors";
import { readFileSync } from "node:fs";
import { relative } from "../../../../common/path";

/**
 * Validates the JSON schema of the manifest.
 */
export const manifestSchema = rule<PluginContext>(function (plugin: PluginContext) {
	if (plugin.manifest.path === undefined) {
		throw new Error("Validating the manifest schema requires the manifest file");
	}

	// Attempt to load the manifest data from the file contents.
	try {
		plugin.manifest.json = readFileSync(plugin.manifest.path, { encoding: "utf-8" });
		plugin.manifest.value = JSON.parse(plugin.manifest.json);
	} catch {
		this.addCritical(plugin.manifest.path, "Failed to parse manifest");
		return;
	}

	// Build the schema used to validate the manifest.
	const ajv = new Ajv({ allErrors: true });
	ajv.addKeyword("markdownDescription");
	const schema = getSchema();
	const validate = ajv.compile(schema);

	// Validate the manifest.
	const valid = validate(plugin.manifest.value);
	if (!valid) {
		betterAjvErrors(schema, plugin.manifest.value, validate.errors as Array<ErrorObject>, { format: "js", json: plugin.manifest.json }).forEach(({ error, start }) => {
			this.addError(plugin.manifest.path!, error.trim(), { position: start });
		});
	}

	plugin.manifest.jsonAst = parse(plugin.manifest.json);
});

/**
 * Gets the schema responsible for validating the manifest JSON.
 * @returns The schema.
 */
function getSchema(): AnySchema {
	const path = relative("../node_modules/@elgato/streamdeck/schemas/manifest.json");
	return JSON.parse(readFileSync(path, { encoding: "utf-8" }));
}
