import { parse, type DocumentNode, type ElementNode, type Location, type MemberNode, type ObjectNode, type ValueNode } from "@humanwhocodes/momoa";
import { type AnyValidateFunction } from "ajv/dist/types";
import betterAjvErrors, { type IOutputError } from "better-ajv-errors";

/**
 * Gets the location of the JSON {@link pointer} from the JSON's abstract syntax tree.
 * @param jsonAst Abstract syntax tree to traverse.
 * @param pointer Pointer to the location to find.
 * @returns The location, otherwise `undefined`.
 */
export function getLocation(jsonAst: DocumentNode, pointer: string): Location | undefined {
	// Split the pointers, and parse numbers for array elements.
	const pointers = pointer
		.split("/")
		.slice(1)
		.map((pointer) => {
			const number = parseInt(pointer);
			return isNaN(number) ? pointer : number;
		});

	return traverse(jsonAst.body, pointers)?.loc?.start;
}

/**
 * Continually traverses through the {@link node}, selecting the {@link pointer}, and continuing with the {@link pointers}.
 * @param node Node to traverse
 * @param param1 Pointers used to traverse the node.
 * @param param1."0" Current pointer.
 * @param param1."1" Remaining pointers.
 * @returns The node for the relative {@link pointer}.
 */
function traverse(node: Node, [pointer, ...pointers]: (number | string)[]): Node | undefined {
	// We've found the node when there are no pointers left.
	if (pointer === undefined) {
		return node;
	}

	// When the node is an array, attempt to return the right element based on the pointer as an index.
	if (node.type === "Array") {
		if (typeof pointer !== "number") {
			throw new TypeError("Pointer is not a number");
		}

		return traverse(node.elements[pointer].value, pointers);
	}

	// When the node is an object, find the first matching member and continue.
	if (node.type === "Object") {
		const filtered = node.members.filter(({ name: { value } }) => value === pointer);
		if (filtered.length !== 1) {
			throw new Error(`Couldn't find property ${pointer}`);
		}

		const { value } = filtered[0];
		return traverse(value, pointers);
	}

	throw new Error(`Unhandled node type ${node.type}`);
}

/**
 * Validates the {@link json} against the {@link validate} schema function. The result is a data object from the parsed {@link json} string, where only valid value-types are set.
 * Valid value types also include their location to enable better error logging.
 * @param json JSON string to parse.
 * @param validate Validate function responsible for validating the {@link json} against a schema.
 * @returns Errors associated with validating the schema, and the parsed result of the {@link json}.
 */
export function validate<T extends object>(json: string, validate: AnyValidateFunction<T>): JsonValidationResult<T> {
	// Check the JSON is valid, and we can parse it.
	let data;
	try {
		data = JSON.parse(json);
		validate(data);
	} catch {
		return {
			errors: [{ error: "JSON contents are invalid", start: { column: 0, line: 0, offset: 0 } }],
			value: {}
		};
	}

	// Check the JSON represents an object (only objects are supported).
	const ast = parse(json, { mode: "json", ranges: false, tokens: false });
	if (ast.body.type !== "Object") {
		return {
			errors: [{ error: "JSON contents must represent a serialized object", start: { column: 0, line: 0, offset: 0 } }],
			value: {}
		};
	}

	// Prettify schema errors, and build the JSON as an object.
	return {
		errors: betterAjvErrors(validate.schema, data, validate.errors ?? [], { format: "js", json }),
		value: toJsonObject(ast.body, validate.errors || [])
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
 * JSON element within a JSON string, including it's parsed value, and the location it was parsed from.
 */
export type JsonElement<T = unknown> = {
	/**
	 * Location of the element within the JSON it was parsed from.
	 */
	location?: Location | undefined;

	/**
	 * Parsed value.
	 */
	value?: T extends Array<infer E> ? JsonObject<E>[] : T extends object ? JsonObject<T> : T;
};

/**
 * Maps the {@link node} to a {@link JsonObject}.
 * @param node Source that contains the data.
 * @param errors JSON schema errors; used to determine invalid types based on the instance path of an error.
 * @returns The mapped JSON object.
 */
function toJsonObject<T>(node: ObjectNode, errors: AnyValidateFunction<T>["errors"]): JsonObject<T> {
	const invalidTypeInstancePaths = new Set<string>(errors?.filter(({ keyword }) => keyword === "type").map(({ instancePath }) => instancePath) || []);

	const reduce: JsonObjectReducer = (node, path) => {
		if (invalidTypeInstancePaths.has(path)) {
			return {
				value: undefined,
				location: node.loc?.start
			};
		}

		// Object node, recursively reduce each member.
		if (node.type === "Object") {
			return node.members.reduce((obj: Record<string, unknown>, member: MemberNode) => {
				obj[member.name.value] = reduce(member.value, `${path}/${member.name.value}`);
				return obj;
			}, {});
		}

		// Array node, recursively reduce each element.
		if (node.type === "Array") {
			return {
				value: node.elements.map((item, i) => reduce(item.value, `${path}/${i}`)),
				location: node.loc?.start
			};
		}

		// Value node.
		if (node.type === "Boolean" || node.type === "Number" || node.type === "String") {
			return {
				value: node.value,
				location: node.loc?.start
			};
		}

		// Null value node.
		if (node.type === "Null") {
			return {
				value: null,
				location: node.loc?.start
			};
		}

		throw new Error(`Encountered unhandled node type '${node.type}' when mapping abstract-syntax tree node to JSON object`);
	};

	return reduce(node, "");
}

/**
 * Reducer that traverses the {@link node} and maps it to a {@link JsonObject} or {@link JsonElement}.
 */
interface JsonObjectReducer {
	(node: ObjectNode, path: string): JsonObject;
	(node: Node, path: string): JsonElement;
}

/**
 * Abstract syntax tree node.
 */
type Node = DocumentNode | ElementNode | ValueNode;
