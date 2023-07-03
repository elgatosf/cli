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
				console.log();
				console.log(i18n.common.invalidUuid);
			}

			return valid;
		}
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
