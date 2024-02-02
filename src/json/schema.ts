import { parse } from "@humanwhocodes/momoa";
import Ajv, { AnySchemaObject, JSONType, KeywordDefinition, type AnySchema, type DefinedError } from "ajv";
import { DataValidationCxt, type AnyValidateFunction } from "ajv/dist/types";
import { type LimitNumberError } from "ajv/dist/vocabularies/validation/limitNumber";
import { existsSync, readFileSync } from "node:fs";
import { type JsonLocation, type LocationRef } from "../common/location";
import { colorize } from "../common/stdout";
import { aggregate } from "../common/utils";
import { JsonObjectMap } from "./map";

/**
 * Keywords ignored as part of validating a JSON string with a JSON schema..
 */
const ignoredKeywords = ["anyOf", "if"];

/**
 * JSON schema capable of validating JSON.
 */
export class JsonSchema<T extends object> {
	/**
	 * Private backing field for {@link filePathsKeywords}.
	 */
	private readonly _filePathsKeywords = new Map<string, FilePathOptions>();

	/**
	 * Private backing field for {@link imageDimensionKeywords}.
	 */
	private readonly _imageDimensionKeywords = new Map<string, ImageDimensions>();

	/**
	 * Internal validator.
	 */
	private readonly _validate: AnyValidateFunction<T>;

	/**
	 * Collection of custom error messages, indexed by their JSON instance path, defined with the JSON schema using `@errorMessage`.
	 */
	private readonly errorMessages = new Map<string, string>();

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
			messages: false,
			strict: false
		});

		ajv.addKeyword("markdownDescription");
		ajv.addKeyword(captureKeyword("errorMessage", "string", this.errorMessages));
		ajv.addKeyword(captureKeyword("imageDimensions", "array", this._imageDimensionKeywords));
		ajv.addKeyword(captureKeyword("filePath", ["boolean", "object"], this._filePathsKeywords));

		this._validate = ajv.compile(typeof source === "string" ? readFromFile(source) : source);
	}

	/**
	 * Collection of {@link FilePathOptions}, indexed by their JSON instance path, defined with the JSON schema using `@filePath`.
	 * @returns The collection of {@link FilePathOptions}.
	 */
	public get filePathsKeywords(): ReadonlyMap<string, FilePathOptions> {
		return this._filePathsKeywords;
	}

	/**
	 * Collection of {@link ImageDimensions}, indexed by their JSON instance path, defined with the JSON schema using `@imageDimensions`.
	 * @returns The collection of {@link FilePathOptions}.
	 */
	public get imageDimensionKeywords(): ReadonlyMap<string, ImageDimensions> {
		return this._imageDimensionKeywords;
	}

	/**
	 * Validates the {@param json}.
	 * @param json JSON string to parse.
	 * @returns Data that could be successfully parsed from the {@param json}, and a collection of errors.
	 */
	public validate(json: string): JsonSchemaValidationResult<T> {
		this._filePathsKeywords.clear();
		this._imageDimensionKeywords.clear();

		// Parse the JSON contents.
		let data;
		try {
			data = JSON.parse(json);
		} catch {
			return {
				map: new JsonObjectMap<T>(),
				errors: [
					{
						source: {
							keyword: "false schema",
							instancePath: "",
							schemaPath: "",
							params: {}
						},
						message: "Contents must be a valid JSON string",
						location: { instancePath: "/", key: undefined }
					}
				]
			};
		}

		// Validate the JSON contents against the schema and parse the abstract-syntax tree.
		this._validate(data);
		const ast = parse(json, { mode: "json", ranges: false, tokens: false });
		const map = new JsonObjectMap(ast.body, this._validate.errors);

		return {
			map,
			errors:
				this._validate.errors
					?.filter(({ keyword }) => !ignoredKeywords.includes(keyword))
					?.map((source) => ({
						location: map.find(source.instancePath)?.location,
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
			const values = aggregate(params.allowedValues, "or", colorize);
			return values !== undefined ? `must be ${values}` : message || `failed validation for keyword: ${keyword}`;
		}

		if (keyword === "pattern") {
			const errorMessage = this.errorMessages.get(instancePath);
			if (errorMessage?.startsWith("String")) {
				return errorMessage.substring(7);
			}

			return errorMessage || `must match pattern ${params.pattern}`;
		}

		if (keyword === "minimum" || keyword === "maximum") {
			return `must be ${getComparison(params.comparison)} ${params.limit}`;
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

		return message || `failed validation for keyword: ${keyword}`;
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
 * Gets the comparison as a string, for example "less than", "greater than", etc.
 * @param comparison Comparison to stringify.
 * @returns String representation of the comparison.
 */
function getComparison(comparison: LimitNumberError["params"]["comparison"]): string {
	switch (comparison) {
		case "<":
			return "less than";
		case "<=":
			return "less than or equal to";
		case ">":
			return "greater than";
		case ">=":
			return "greater than or equal to";
		default:
			throw new TypeError(`Expected comparison when validating JSON: ${comparison}`);
	}
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
 * Image dimensions, in pixels.
 */
export type ImageDimensions = [width: number, height: number];

/**
 * Options used to determine a valid file path, used to generate the regular expression pattern.
 */
export type FilePathOptions =
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
	 * Map of the parsed data.
	 */
	map: JsonObjectMap<T>;
};

/**
 * Provides information relating to a JSON error.
 */
export type JsonSchemaError = LocationRef<JsonLocation> & {
	/**
	 * User-friendly message that explain the error.
	 */
	message: string;

	/**
	 * Source of the error.
	 */
	source: DefinedError;
};
