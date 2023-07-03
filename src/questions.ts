import chalk from "chalk";
import { InputQuestion } from "inquirer";

import { isValidUUID } from "./manifest.js";

/**
 * Provides an {@link InputQuestion} that is responsible for prompting the user for a valid UUID.
 * @param defaultValue Default UUID to suggest.
 * @returns Question data that represents a prompt for a UUID.
 */
export function uuid(defaultValue: InputQuestion["default"]): InputQuestion<UuidAnswer> {
	return {
		name: "uuid",
		message: "Plugin UUID:",
		default: defaultValue,
		type: "input",
		validate: (uuid: string) => {
			const valid = isValidUUID(uuid);
			if (!valid) {
				console.log();
				console.log(chalk.red("UUID can only contain lowercase alphanumeric characters (a-z, 0-9), hyphens (-), underscores (_), or periods (.)."));
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
