/**
 * Gets the user-friendly path from the specified {@link pointer}.
 * @param pointer JSON pointer to the error in the source JSON.
 * @returns User-friendly path.
 */
export function getPath(pointer: string): string {
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
