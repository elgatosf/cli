import chalk from "chalk";

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
		if (this.details?.position) {
			this.position = `${this.details.position.line}`;
			if (this.details.position.column) {
				this.position += `:${this.details.position.column}`;
			}
		}
	}

	/**
	 * Converts the entry to a string.
	 * @param positionPad Padding required to align the position of each entry.
	 * @returns String that represents the entry.
	 */
	public toString(positionPad: number): string {
		const position = positionPad === 0 ? "" : `  ${chalk.gray(this.position.padEnd(positionPad))}`;
		const level = this.level === ValidationLevel.error ? chalk.red(ValidationLevel[this.level].padEnd(7)) : chalk.yellow(ValidationLevel[this.level].padEnd(7));
		const message = this.details?.suggestion !== undefined ? `${this.message}  ${chalk.gray(this.details.suggestion)}` : this.message;

		return `${position}  ${level}  ${message}`;
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
export type ValidationEntryDetails = {
	/**
	 * Optional suggestion to fix the validation entry.
	 */
	suggestion?: string;

	/**
	 * Position of a validation entry within a file.
	 */
	position?: {
		/**
		 * Column number.
		 */
		column?: number;

		/**
		 * Line number.
		 */
		line: number;
	};
};
