import { parse, type ArrayNode, type DocumentNode, type ElementNode, type Location, type MemberNode, type NullNode, type ObjectNode, type ValueNode } from "@humanwhocodes/momoa";
import { ErrorObject, type AnyValidateFunction } from "ajv/dist/types";
import { isArray } from "lodash";

/**
 * Result of validating a JSON string.
 */
type JsonValidationResult<T> = {
	/**
	 * Errors produced by validating the JSON against a schema.
	 */
	errors: JsonSchemaError<T>[];

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
	const map = ast.body.type === "Object" ? toJsonObjectMap(ast.body, validate.errors) : { data: {}, locations: new Map<string, Location>() };

	return {
		value: map.data,
		errors: validate.errors?.map((e) => new JsonSchemaError(e as ErrorObject<JsonSchemaErrorKeyword>, map.locations)) ?? []
	};
}

/**
 * Known keywords that denote JSON schema errors.
 */
type JsonSchemaErrorKeyword = "additionalProperties" | "enum" | "maxItems" | "minItems" | "pattern" | "required" | "type";

/**
 * Provides information relating to a JSON error, as part from {@link ErrorObject}.
 */
export class JsonSchemaError<T> {
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
	constructor({ instancePath: pointer, keyword, message, params }: ErrorObject<JsonSchemaErrorKeyword>, locations: JsonObjectMap<T>["locations"]) {
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
 * Maps the {@link node} to a {@link JsonObjectMap}.
 * @param node Source that contains the data.
 * @param errors JSON schema errors; used to determine invalid types based on the instance path of an error.
 * @returns The mapped JSON object.
 */
function toJsonObjectMap<T>(node: ObjectNode, errors: AnyValidateFunction<T>["errors"]): JsonObjectMap<T> {
	const locations = new Map<string, Location | undefined>();
	const reduce = (node: ArrayNode | DocumentNode | ElementNode | NullNode | ObjectNode | ValueNode, pointer: string): JsonElement | JsonElement[] | JsonObject => {
		locations.set(pointer, node.loc?.start);

		// Node is considered an invalid type, so ignore the value.
		if (errors?.find((e) => e.instancePath === pointer && e.keyword === "type")) {
			return new JsonValueNode(pointer, undefined, node.loc?.start);
		}

		// Object node, recursively reduce each member.
		if (node.type === "Object") {
			return node.members.reduce((obj: Record<string, ReturnType<typeof reduce>>, member: MemberNode) => {
				obj[member.name.value] = reduce(member.value, `${pointer}/${member.name.value}`);
				return obj;
			}, {});
		}

		// Array node, recursively reduce each element.
		if (node.type === "Array") {
			return node.elements.map((item, i) => reduce(item.value, `${pointer}/${i}`));
		}

		// Value node.
		if (node.type === "Boolean" || node.type === "Number" || node.type === "String") {
			return new JsonValueNode(pointer, node.value, node.loc?.start);
		}

		// Null value node.
		if (node.type === "Null") {
			return new JsonValueNode(pointer, null, node.loc?.start);
		}

		throw new Error(`Encountered unhandled node type '${node.type}' when mapping abstract-syntax tree node to JSON object`);
	};

	return {
		data: reduce(node, "") as JsonObject<T>,
		locations
	};
}

/**
 * JSON object map that provides data parsed from an {@link ObjectNode}, and the locations associated with each node.
 */
type JsonObjectMap<T> = {
	/**
	 * Parsed data.
	 */
	data: JsonObject<T>;

	/**
	 * Location of each parsed node, indexed by their JSON pointer.
	 */
	locations: Map<string, Location | undefined>;
};

/**
 * JSON object that includes all valid value-types of {@template T}, and defines all invalid value-types as `undefined`.
 */
export type JsonObject<T = unknown> = {
	[K in keyof T]?: JsonElement<T[K]>;
};

/**
 * JSON property within a JSON string, including it's parsed value, and the location it was parsed from.
 */
export type JsonElement<T = unknown> = T extends Array<infer E> ? JsonElement<E>[] : T extends object | undefined ? JsonObject<T> : JsonValueNode<T>;

/**
 * Represents a node within a JSON structure.
 */
export class JsonValueNode<T> {
	/**
	 * Initializes a new instance of the {@link JsonValueNode} class.
	 * @param pointer JSON pointer to the element in the JSON.
	 * @param value Parsed value.
	 * @param location Location of the element within the JSON it was parsed from.
	 */
	constructor(
		public readonly pointer: string,
		public readonly value: T,
		public readonly location: Location | undefined
	) {}

	/** @inheritdoc */
	public toString(): string | undefined {
		return this.value?.toString();
	}
}
