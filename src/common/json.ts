import { parse, type ArrayNode, type DocumentNode, type ElementNode, type Location, type MemberNode, type NullNode, type ObjectNode, type ValueNode } from "@humanwhocodes/momoa";
import { type AnyValidateFunction } from "ajv/dist/types";
import betterAjvErrors, { type IOutputError } from "better-ajv-errors";

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
			errors: [{ error: "Contents must be a valid JSON string", start: { column: 0, line: 0, offset: 0 } }],
			value: {}
		};
	}

	// Validate the JSON contents against the schema.
	validate(data);
	const errors = betterAjvErrors(validate.schema, data, validate.errors ?? [], { format: "js", json });

	// Return the errors, and build the JSON object if the AST allows it.
	const ast = parse(json, { mode: "json", ranges: false, tokens: false });
	return {
		errors,
		value: ast.body.type === "Object" ? toJsonObject(ast.body, validate.errors) : {}
	};
}

/**
 * Result of validating a JSON string.
 */
type JsonValidationResult<T> = {
	/**
	 * Errors produced by validating the JSON against a schema.
	 */
	errors: IOutputError[];

	/**
	 * Parsed value, represented as a collection of values and their locations, mapped to the structure of {@template T}.
	 */
	value: JsonObject<T>;
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
export type JsonElement<T = unknown> = T extends Array<infer E>
	? JsonElement<E>[]
	: T extends object | undefined
	? JsonObject<T>
	: {
			/**
			 * Location of the element within the JSON it was parsed from.
			 */
			location?: Location | undefined;

			/**
			 * JSON pointer to the element in the JSON.
			 */
			pointer: string;

			/**
			 * Parsed value.
			 */
			value?: T;
	  };

/**
 * Maps the {@link node} to a {@link JsonObject}.
 * @param node Source that contains the data.
 * @param errors JSON schema errors; used to determine invalid types based on the instance path of an error.
 * @returns The mapped JSON object.
 */
function toJsonObject<T>(node: ObjectNode, errors: AnyValidateFunction<T>["errors"]): JsonObject<T> {
	const invalidTypeInstancePaths = new Set<string>(errors?.filter(({ keyword }) => keyword === "type").map(({ instancePath }) => instancePath) || []);

	const reduce = (node: Node, pointer: string): JsonElement | JsonElement[] | JsonObject => {
		if (invalidTypeInstancePaths.has(pointer)) {
			return {
				location: node.loc?.start,
				pointer,
				value: undefined
			};
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
			return {
				location: node.loc?.start,
				pointer,
				value: node.value
			};
		}

		// Null value node.
		if (node.type === "Null") {
			return {
				location: node.loc?.start,
				pointer,
				value: null
			};
		}

		throw new Error(`Encountered unhandled node type '${node.type}' when mapping abstract-syntax tree node to JSON object`);
	};

	return reduce(node, "") as JsonObject<T>;
}

/**
 * Abstract syntax tree node.
 */
type Node = ArrayNode | DocumentNode | ElementNode | NullNode | ObjectNode | ValueNode;
