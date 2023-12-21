import type { DocumentNode, ElementNode, Location, ValueNode } from "@humanwhocodes/momoa";

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
 * Abstract syntax tree node.
 */
type Node = DocumentNode | ElementNode | ValueNode;
