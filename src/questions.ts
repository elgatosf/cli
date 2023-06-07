import chalk from "chalk";
import { InputQuestion } from "inquirer";

import { isValidUUID } from "./plugin-info.js";

/**
 * Provides an {@link InputQuestion} that is responsible for prompting the user for a valid UUID.
 * @param defaultValue Default UUID to offer.
 * @returns Question data that represents a prompt for a UUID.
 */
export function uuid(defaultValue: InputQuestion["default"]): InputQuestion {
	return {
		name: "uuid",
		message: "Plugin UUID:",
		default: defaultValue,
		type: "input",
		validate: (uuid: string) => {
			const valid = isValidUUID(uuid);
			if (!valid) {
				console.log();
				console.log(chalk.red("UUID can only contain lower-case alpha-numeric characters (a-z, 0-9), hyphens (-), underscores (_), or periods (.)."));
			}

			return valid;
		}
	};
}
