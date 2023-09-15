/**
 * Validates the specified {@link value} represents a valid directory name.
 * @param value Value to validate.
 * @returns `true` when the {@link value} represents a valid directory name; otherwise `false`.
 */
export function isSafeBaseName(value: string): boolean {
	// Check the name is defined.
	if (value.trim().length === 0) {
		return false;
	}

	// Check the name does not begin with a period.
	if (value.trim().startsWith(".")) {
		return false;
	}

	// Check the name does not contain an invalid character.
	return !invalidCharacters.some((invalid) => value.includes(invalid));
}

/**
 * Collection of characters that are considered invalid when part of a directory name.
 */
export const invalidCharacters = ["\\", "/", ":", "*", "?", '"', "<", ">", "|"];
