import { type ArrayNode, type DocumentNode, type ElementNode, type MemberNode, type NullNode, type ObjectNode, type ValueNode } from "@humanwhocodes/momoa";
import { type AnyValidateFunction } from "ajv/dist/types";
import { type Location, type LocationRef } from "../location";

/**
 * JSON object map that provides data parsed from an {@link ObjectNode}, and the locations associated with each node.
 */
export class JsonObjectMap<T> {
	/**
	 * Parsed data.
	 */
	public readonly data: JsonObject<T> = {};

	/**
	 * Location of each parsed node, indexed by their JSON pointer.
	 */
	public readonly locations = new Map<string, Location | undefined>();

	/**
	 * Initializes a new instance of the {@link JsonObjectMap} class.
	 * @param node Source that contains the data.
	 * @param errors JSON schema errors; used to determine invalid types based on the instance path of an error.
	 */
	constructor(node: ValueNode, errors: AnyValidateFunction<T>["errors"]) {
		if (node.type === "Object") {
			this.data = this.aggregate(node, "", errors) as JsonObject<T>;
		}
	}

	/**
	 * Aggregates the {@param node} to an object containing the property values and their paths.
	 * @param node Node to aggregate.
	 * @param pointer Pointer to the {@param node}.
	 * @param errors Errors associated with the JSON used to parse the {@param node}.
	 * @returns Aggregated object.
	 */
	private aggregate(
		node: ArrayNode | DocumentNode | ElementNode | NullNode | ObjectNode | ValueNode,
		pointer: string,
		errors: AnyValidateFunction<T>["errors"]
	): JsonElement | JsonElement[] | JsonObject {
		const location = { ...node.loc?.start, key: getPath(pointer) };
		this.locations.set(pointer, location);

		// Node is considered an invalid type, so ignore the value.
		if (errors?.find((e) => e.instancePath === pointer && e.keyword === "type")) {
			return new JsonValueNode(undefined, location);
		}

		// Object node, recursively reduce each member.
		if (node.type === "Object") {
			return node.members.reduce((obj: Record<string, JsonElement | JsonElement[] | JsonObject>, member: MemberNode) => {
				obj[member.name.value] = this.aggregate(member.value, `${pointer}/${member.name.value}`, errors);
				return obj;
			}, {});
		}

		// Array node, recursively reduce each element.
		if (node.type === "Array") {
			return node.elements.map((item, i) => this.aggregate(item.value, `${pointer}/${i}`, errors));
		}

		// Value node.
		if (node.type === "Boolean" || node.type === "Number" || node.type === "String") {
			return new JsonValueNode(node.value, location);
		}

		// Null value node.
		if (node.type === "Null") {
			return new JsonValueNode(null, location);
		}

		throw new Error(`Encountered unhandled node type '${node.type}' when mapping abstract-syntax tree node to JSON object`);
	}
}

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
class JsonValueNode<T> implements LocationRef {
	/**
	 * Initializes a new instance of the {@link JsonValueNode} class.
	 * @param value Parsed value.
	 * @param location Location of the element within the JSON it was parsed from.
	 */
	constructor(
		public readonly value: T,
		public readonly location: Location
	) {}

	/** @inheritdoc */
	public toString(): string | undefined {
		return this.value?.toString();
	}
}

/**
 * Gets the user-friendly path from the specified {@link pointer}.
 * @param pointer JSON pointer to the error in the source JSON.
 * @returns User-friendly path.
 */
function getPath(pointer: string): string {
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
