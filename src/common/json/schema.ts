import { parse } from "@humanwhocodes/momoa";
import Ajv, { AnySchemaObject, JSONType, KeywordDefinition, type AnySchema, type DefinedError } from "ajv";
import { DataValidationCxt, type AnyValidateFunction } from "ajv/dist/types";
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
	 * Collection of custom error messages, indexed by their JSON instance path, defined with the JSON schema using `@errorMessage`.
	 */
	private errorMessages = new Map<string, string>();

	/**
	 * Collection of {@link FilePathOptions}, indexed by their JSON instance path, defined with the JSON schema using `@filePath`.
	 */
	private filePaths = new Map<string, FilePathOptions>();

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
		ajv.addKeyword(captureKeyword("errorMessage", "string", this.errorMessages));
		ajv.addKeyword(captureKeyword("filePath", ["boolean", "object"], this.filePaths));

		this._validate = ajv.compile(typeof source === "string" ? readFromFile(source) : source);
	}

	/**
	 * Gets the {@link FilePathOptions} for the specified {@link instancePath}.
	 * @param instancePath JSON instance path.
	 * @returns The file path options; otherwise undefined.
	 */
	public getFilePathOptions(instancePath: string): Readonly<FilePathOptions> | undefined {
		return this.filePaths.get(instancePath);
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
					message: this.getMessage(source as DefinedError),
					source: source as DefinedError
				})) ?? []
		};
	}

	/**
	 * Parses the error message from the specified {@link ErrorObject}.
	 * @param error JSON schema error.
	 * @returns The error message.
	 */
	private getMessage(error: DefinedError): string {
		const { keyword, message, params, instancePath } = error;

		if (keyword === "additionalProperties") {
			return params.additionalProperty !== undefined ? `must not contain property: ${params.additionalProperty}` : "must not contain additional properties";
		}

		if (keyword === "enum") {
			const values = getEnumAllowedValues(params);
			return values !== undefined ? `must be ${values}` : message || unknownMessage;
		}

		if (keyword === "pattern") {
			const errorMessage = this.errorMessages.get(instancePath);
			if (errorMessage?.startsWith("String")) {
				return errorMessage.substring(7);
			}

			return errorMessage || `must match pattern ${params.pattern}`;
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
}

/**
 * Captures all instances of the keyword, and stores their schemas in the {@link map}.
 * @param keyword Keyword to capture.
 * @param schemaType Expected schema type of the keyword.
 * @param map The map where the keyword instances will be captured.
 * @returns The keyword definition.
 */
function captureKeyword(keyword: string, schemaType: JSONType | JSONType[], map: Map<string, unknown>): KeywordDefinition {
	return {
		keyword,
		schemaType,
		validate: (schema: unknown, data: unknown, parentSchema?: AnySchemaObject, dataCtx?: DataValidationCxt): boolean => {
			if (dataCtx?.instancePath !== undefined) {
				map.set(dataCtx.instancePath, schema);
			}

			return true;
		}
	};
}

/**
 * Gets the valid enum values from the {@link params} associated with the error object.
 * @param params Parameters that define the allowed enum values.
 * @returns The allowed enum values, as a concatenated string.
 */
function getEnumAllowedValues(params: EnumError["params"]): string | undefined {
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
 * Get a {@link JsonSchema} from the contents of the specified {@link path}.
 * @param path File path to the JSON schema.
 * @returns The schema.
 */
function readFromFile(path: string): AnySchema {
	if (!existsSync(path)) {
		throw new Error(`Failed to read JSON schema, file not found: ${path}`);
	}

	try {
		return JSON.parse(readFileSync(path, { encoding: "utf-8" }));
	} catch (cause) {
		throw new Error("Failed to parse JSON schema", { cause });
	}
}

/**
 * Options used to determine a valid file path, used to generate the regular expression pattern.
 */
type FilePathOptions =
	| true
	| {
			/**
			 * Collection of valid file extensions.
			 */
			extensions: string[];
			/**
			 * Determines whether the extension must be present, or omitted, from the file path.
			 */
			includeExtension: boolean;
	  };

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
