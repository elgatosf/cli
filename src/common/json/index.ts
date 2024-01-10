import { parse } from "@humanwhocodes/momoa";
import { ErrorObject, type AnyValidateFunction } from "ajv/dist/types";
import { JsonSchemaError, JsonSchemaErrorKeyword } from "./error";
import { JsonElement, JsonObject, JsonObjectMap } from "./map";

export { JsonElement, JsonObject, JsonSchemaError };

/**
 * Result of validating a JSON string.
 */
type JsonValidationResult<T> = {
	/**
	 * Errors produced by validating the JSON against a schema.
	 */
	errors: JsonSchemaError[];

	/**
	 * Parsed value, represented as a collection of values and their locations, mapped to the structure of {@template T}.
	 */
	value: JsonObject<T>;
};

/**
 * Validates the {@link json} against the {@link validate} schema function. The result is a data object from the parsed {@link json} string, where only valid value-types are set.
 * Valid value types also include their location to enable better error logging.
 * @param json JSON string to parse.
 * @param validate Validate function responsible for validating the {@link json} against a schema.
 * @returns Errors associated with validating the schema, and the parsed result of the {@link json}.
 */
export function validate<T extends object>(json: string, validate: AnyValidateFunction<T>): JsonValidationResult<T> {
	// Parse the JSON contents.
	let data;
	try {
		data = JSON.parse(json);
	} catch {
		return {
			errors: [
				{
					path: "",
					pointer: "",
					message: "Contents must be a valid JSON string",
					position: { column: 0, line: 0, offset: 0 }
				}
			],
			value: {}
		};
	}

	// Validate the JSON contents against the schema and parse the abstract-syntax tree.
	validate(data);
	const ast = parse(json, { mode: "json", ranges: false, tokens: false });
	const map = new JsonObjectMap(ast.body, validate.errors);

	return {
		value: map.data,
		errors: validate.errors?.map((e) => new JsonSchemaError(e as ErrorObject<JsonSchemaErrorKeyword>, map.locations)) ?? []
	};
}
