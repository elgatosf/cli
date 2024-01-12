import { parse } from "@humanwhocodes/momoa";
import Ajv, { type AnySchema, type DefinedError } from "ajv";
import { type AnyValidateFunction } from "ajv/dist/types";
import { type EnumError } from "ajv/dist/vocabularies/validation/enum";
import { existsSync, readFileSync } from "node:fs";
import { type LocationRef } from "../location";
import { colorize } from "../stdout";
import { JsonObjectMap, type JsonObject } from "./map";

const unknownMessage = "could not be validated (unknown error)";

/**
 * JSON schema capable of validating JSON.
 */
export class JsonSchema<T extends object> {
	/**
	 * Internal validator.
	 */
	private _validate: AnyValidateFunction<T>;

	/**
	 * Initializes a new instance of the {@link JsonSchema} class.
	 * @param path File path to the JSON schema.
	 */
	constructor(path: string);
	/**
	 * Initializes a new instance of the {@link JsonSchema} class.
	 * @param schema Schema that defines the JSON structure.
	 */
	constructor(schema: AnySchema);
	/**
	 * Initializes a new instance of the {@link JsonSchema} class.
	 * @param source Source responsible for validating JSON.
	 */
	constructor(source: AnySchema | string) {
		const ajv = new Ajv({
			allErrors: true,
			messages: false
		});

		ajv.addKeyword("markdownDescription");
		this._validate = ajv.compile(typeof source === "string" ? JsonSchema.readFromFile(source) : source);
	}

	/**
	 * Validates the {@param json}.
	 * @param json JSON string to parse.
	 * @returns Data that could be successfully parsed from the {@param json}, and a collection of errors.
	 */
	public validate(json: string): JsonSchemaValidationResult<T> {
		// Parse the JSON contents.
		let data;
		try {
			data = JSON.parse(json);
		} catch {
			return {
				errors: [
					{
						source: {
							keyword: "false schema",
							instancePath: "",
							schemaPath: "",
							params: {}
						},
						message: "Contents must be a valid JSON string",
						location: { key: undefined }
					}
				],
				value: {}
			};
		}

		// Validate the JSON contents against the schema and parse the abstract-syntax tree.
		this._validate(data);
		const ast = parse(json, { mode: "json", ranges: false, tokens: false });
		const map = new JsonObjectMap(ast.body, this._validate.errors);

		return {
			value: map.data,
			errors:
				this._validate.errors?.map((source) => ({
					location: map.locations.get(source.instancePath),
					message: JsonSchema.getMessage(source as DefinedError),
					source: source as DefinedError
				})) ?? []
		};
	}

	/**
	 * Gets the valid enum values from the {@link params} associated with the error object.
	 * @param params Parameters that define the allowed enum values.
	 * @returns The allowed enum values, as a concatenated string.
	 */
	private static getEnumAllowedValues(params: EnumError["params"]): string | undefined {
		const { allowedValues } = params;
		let result = "";

		for (let i = 0; i < allowedValues.length; i++) {
			if (i > 0) {
				result += i < allowedValues.length - 1 ? ", " : " or ";
			}

			result += colorize(allowedValues[i]);
		}

		return result;
	}

	/**
	 * Parses the error message from the specified {@link ErrorObject}.
	 * @param param0 JSON schema error.
	 * @param param0.keyword Keyword that defines the type of the error.
	 * @param param0.message Original error message.
	 * @param param0.params Supporting parameters that define the JSON schema error.
	 * @returns The error message.
	 */
	private static getMessage({ keyword, message, params }: DefinedError): string {
		if (keyword === "additionalProperties") {
			return params.additionalProperty !== undefined ? `must not contain property: ${params.additionalProperty}` : "must not contain additional properties";
		}

		if (keyword === "enum") {
			const values = JsonSchema.getEnumAllowedValues(params);
			return values !== undefined ? `must be ${values}` : message || unknownMessage;
		}

		if (keyword === "pattern") {
			return `must match pattern ${params.pattern}`;
		}

		if (keyword === "minItems") {
			return `must contain at least ${params.limit} item${params.limit === 1 ? "" : "s"}`;
		}

		if (keyword === "maxItems") {
			return `must not contain more than ${params.limit} item${params.limit === 1 ? "" : "s"}`;
		}

		if (keyword === "required") {
			return `must contain property: ${params.missingProperty}`;
		}

		if (keyword === "type") {
			return `must be a${params.type === "object" ? "n" : ""} ${params.type}`;
		}

		if (keyword === "uniqueItems") {
			return "must not contain duplicate items";
		}

		return message || unknownMessage;
	}

	/**
	 * Get a {@link JsonSchema} from the contents of the specified {@link path}.
	 * @param path File path to the JSON schema.
	 * @returns The schema.
	 */
	private static readFromFile(path: string): AnySchema {
		if (!existsSync(path)) {
			throw new Error(`Failed to read JSON schema, file not found: ${path}`);
		}

		try {
			return JSON.parse(readFileSync(path, { encoding: "utf-8" }));
		} catch (cause) {
			throw new Error("Failed to parse JSON schema", { cause });
		}
	}
}

/**
 * Result of validating a JSON string.
 */
export type JsonSchemaValidationResult<T> = {
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
 * Provides information relating to a JSON error.
 */
export type JsonSchemaError = LocationRef & {
	/**
	 * User-friendly message that explain the error.
	 */
	message: string;

	/**
	 * Source of the error.
	 */
	source: DefinedError;
};
