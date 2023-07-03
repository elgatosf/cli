import { InputQuestion } from "inquirer";

import i18n from "./i18n/index.js";
import { isValidUUID } from "./manifest.js";

/**
 * Provides an {@link InputQuestion} that is responsible for prompting the user for a valid UUID.
 * @param defaultValue Default UUID to suggest.
 * @returns Question data that represents a prompt for a UUID.
 */
export function uuid(defaultValue: InputQuestion["default"]): InputQuestion<UuidAnswer> {
	return {
		name: "uuid",
		message: i18n.common.uuid,
		default: defaultValue,
		type: "input",
		validate: (uuid: string) => {
			const valid = isValidUUID(uuid);
			if (!valid) {
				return i18n.common.invalidUuid;
			}

			return valid;
		}
	};
}

/**
 * Gets a function that accepts a single value; when that value is null, empty, or whitespace, the {@link error} is returned.
 * @param error Error message to display when a value was not specified.
 * @returns Function that can be used to validate an question's answer.
 */
export function validateRequired(error: string) {
	return (value: unknown) => {
		if (value && value?.toString().replaceAll(" ", "") != "") {
			return true;
		}

		return error;
	};
}

/**
 * Represents the answer type of {@link uuid}.
 */
type UuidAnswer = {
	/**
	 * Unique identifier.
	 */
	uuid: string;
};
