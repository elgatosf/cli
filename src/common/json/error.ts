import { type Location } from "@humanwhocodes/momoa";
import { ErrorObject } from "ajv/dist/types";
import { isArray } from "lodash";

/**
 * Provides information relating to a JSON error, as part from {@link ErrorObject}.
 */
export class JsonSchemaError {
	/**
	 * User-friendly message that explain the JSON schema error.
	 */
	public readonly message: string;

	/**
	 * User-friendly path to the error.
	 */
	public readonly path: string;

	/**
	 * JSON pointer to the error in the source JSON.
	 */
	public readonly pointer: string;

	/**
	 * Position of the JSON error within the source JSON.
	 */
	public readonly position: Location | undefined;

	/**
	 * Initializes a new instance of the {@link JsonSchemaError} class.
	 * @param param0 JSON schema error.
	 * @param param0.instancePath JSON pointer to the error in the source JSON.
	 * @param param0.keyword Keyword that defines the type of the error.
	 * @param param0.message Original error message.
	 * @param param0.params Supporting parameters that define the JSON schema error.
	 * @param locations Locations of JSON nodes, indexed by their JSON pointer.
	 */
	constructor({ instancePath: pointer, keyword, message, params }: ErrorObject<JsonSchemaErrorKeyword>, locations: Map<string, Location | undefined>) {
		this.path = JsonSchemaError.getPath(pointer);
		this.pointer = pointer;
		this.position = locations.get(this.pointer);

		message = message ?? `${this.path} is invalid (error: ${keyword})`;

		switch (keyword) {
			case "additionalProperties":
				this.message = "additionalProperty" in params ? `must not contain property '${params.additionalProperty}'` : "must not contain additional properties";
				break;

			case "enum": {
				const values = JsonSchemaError.getEnumAllowedValues(params);
				this.message = values !== undefined ? `must be ${values}` : message;
				break;
			}

			case "pattern":
				this.message = "pattern" in params ? `must match pattern ${params.pattern}` : message;
				break;

			case "minItems":
				this.message = "limit" in params ? `must contain at least ${params.limit} items` : message;
				break;

			case "maxItems":
				this.message = "limit" in params ? `must not contain more than ${params.limit} items` : message;
				break;

			case "required":
				this.message = "missingProperty" in params ? `must contain property '${params.missingProperty}'` : message;
				break;

			case "type":
				this.message = "type" in params ? `must be a${params.type === "object" ? "n" : ""} ${params.type}` : message;
				break;

			default:
				this.message = message;
				break;
		}

		this.message = `${this.path} ${this.message}`;
	}

	/**
	 * Gets the valid enum values from the {@link params} associated with the error object.
	 * @param params Parameters that define the allowed enum values.
	 * @returns The allowed enum values, as a concatenated string.
	 */
	private static getEnumAllowedValues(params: ErrorObject["params"]): string | undefined {
		if (!("allowedValues" in params) || !isArray(params.allowedValues)) {
			return undefined;
		}

		const { allowedValues } = params;
		let result = "";
		for (let i = 0; i < allowedValues.length; i++) {
			if (i > 0) {
				result += i < allowedValues.length - 1 ? ", " : " or ";
			}

			result += typeof allowedValues[i] === "string" ? `'${allowedValues[i]}'` : typeof allowedValues[i];
		}

		return result;
	}

	/**
	 * Gets the user-friendly path from the specified {@link pointer}.
	 * @param pointer JSON pointer to the error in the source JSON.
	 * @returns User-friendly path.
	 */
	private static getPath(pointer: string): string {
		const path = pointer.split("/").reduce((path, segment) => {
			if (segment === undefined || segment === "") {
				return path;
			}

			if (!isNaN(Number(segment))) {
				return `${path}[${segment}]`;
			}

			return `${path}.${segment}`;
		}, "");

		return path.startsWith(".") ? path.slice(1) : path;
	}
}

/**
 * Known keywords that denote JSON schema errors.
 */
export type JsonSchemaErrorKeyword = "additionalProperties" | "enum" | "maxItems" | "minItems" | "pattern" | "required" | "type";
