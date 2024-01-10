import chalk from "chalk";
import { EOL } from "os";
import { LocationRef } from "../../common/location";

/**
 * Provides information about a validation entry.
 */
export class ValidationEntry {
	/**
	 * Position of the validation entry, represented as a string in the format {line}:{column}.
	 */
	public readonly position: string = "";

	/**
	 * Initializes a new instance of the {@link ValidationEntry} class.
	 * @param level Severity level of the entry.
	 * @param message Validation message.
	 * @param details Supporting optional details.
	 */
	constructor(
		public readonly level: ValidationLevel,
		public readonly message: string,
		public readonly details?: ValidationEntryDetails
	) {
		if (this.details?.location) {
			this.position = `${this.details.location.line}`;
			if (this.details.location.column) {
				this.position += `:${this.details.location.column}`;
			}
		}
	}

	/**
	 * Converts the entry to a string.
	 * @param positionPad Padding required to align the position of each entry.
	 * @returns String that represents the entry.
	 */
	public toString(positionPad: number): string {
		const position = positionPad === 0 ? "" : `  ${chalk.dim(this.position.padEnd(positionPad))}`;
		const level = this.level === ValidationLevel.error ? chalk.red(ValidationLevel[this.level].padEnd(7)) : chalk.yellow(ValidationLevel[this.level].padEnd(7));

		// Construct the base message
		let message = this.message;
		if (this.details?.location?.key) {
			message = `${chalk.cyan(this.details.location.key)} ${message}`;
		}

		// Prepend the position and level, and append the suggestion (if available).
		message = `${position}  ${level}  ${message}`;
		if (this.details?.suggestion) {
			message += `${EOL}${" ".repeat(positionPad + 13)}${chalk.dim(`└ ${this.details.suggestion}`)}`;
		}

		return message;
	}
}

/**
 * Levels of validation.
 */
export enum ValidationLevel {
	/**
	 * Error.
	 */
	error = 0,

	/**
	 * Warning.
	 */
	warning = 1
}

/**
 * Optional details associated with the validation entry.
 */
export type ValidationEntryDetails = LocationRef & {
	/**
	 * Optional suggestion to fix the validation entry.
	 */
	suggestion?: string;
};
