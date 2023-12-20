import { type StdOut } from "../../common/stdout";
import { ValidationEntry, ValidationEntryDetails, ValidationLevel } from "./entry";
import { ValidationEntryCollection } from "./entry-collection";

/**
 * Validates the specified {@link context} against the {@link rules}.
 * @param context Context to validate.
 * @param rules Rules used to validate the context.
 * @returns Validation result.
 */
export function validate<T>(context: T, rules: ValidationRule<T>[]): ValidationResult {
	let isCancellationRequested = false;
	const result = new ValidationResult();

	const validator: Validator<T> = {
		addCritical: function (path: string, message: string, details?: ValidationEntryDetails): typeof validator {
			isCancellationRequested = true;
			result.add(path, new ValidationEntry(ValidationLevel.error, message, details));
			return validator;
		},
		addError: function (path: string, message: string, details?: ValidationEntryDetails): typeof validator {
			result.add(path, new ValidationEntry(ValidationLevel.error, message, details));
			return validator;
		},
		addWarning: function (path: string, message: string, details?: ValidationEntryDetails): typeof validator {
			result.add(path, new ValidationEntry(ValidationLevel.warning, message, details));
			return validator;
		},
		...context
	};

	for (const rule of rules) {
		rule.call(validator);
		if (isCancellationRequested) {
			break;
		}
	}

	return result;
}

/**
 * Validator capable of recording a
 */
type Validator<TContext> = TContext & {
	/**
	 * Adds a critical validation error; validation will be cancelled.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param details Optional details.
	 * @returns This instance for chaining.
	 */
	addCritical(path: string, message: string, details?: ValidationEntryDetails): Validator<TContext>;

	/**
	 * Adds a validation error.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param details Optional details.
	 * @returns This instance for chaining.
	 */
	addError(path: string, message: string, details?: ValidationEntryDetails): Validator<TContext>;

	/**
	 * Adds a validation warning.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param details Optional details.
	 * @returns This instance for chaining.
	 */
	addWarning(path: string, message: string, details?: ValidationEntryDetails): Validator<TContext>;
};

/**
 * Wraps a validation rule.
 * @param fn Delegate function responsible for applying the validation rule.
 * @returns The validation rule.
 */
export const rule = <TContext>(fn: ValidationRule<TContext>): ValidationRule<TContext> => fn;

/**
 * Validation rule that will be executed as part of a validator.
 */
export type ValidationRule<TContext> = (this: Validator<TContext>) => void;

/**
 * Validation result.
 */
export class ValidationResult extends Array<ValidationEntryCollection> implements ReadonlyArray<ValidationEntryCollection> {
	/**
	 * Private backing field for {@link Result.errorCount}.
	 */
	private errorCount = 0;

	/**
	 * Private backing field for {@link Result.warningCount}.
	 */
	private warningCount = 0;

	/**
	 * Determines whether the validation result is considered successful.
	 * @returns `true` when validation passed; otherwise `false`.
	 */
	public get success(): boolean {
		return this.errorCount === 0;
	}

	/**
	 * Adds a new validation entry to the result.
	 * @param path Directory or file path the entry is associated with.
	 * @param entry Validation entry.
	 */
	public add(path: string, entry: ValidationEntry): void {
		if (entry.level === ValidationLevel.error) {
			this.errorCount++;
		} else {
			this.warningCount++;
		}

		let collection = this.find((c) => c.path === path);
		if (collection === undefined) {
			collection = new ValidationEntryCollection(path);
			this.push(collection);
		}

		collection.add(entry);
	}

	/**
	 * Writes the results to the specified {@link output}.
	 * @param output Output to write to.
	 */
	public writeTo(output: StdOut): void {
		// Write each entry.
		if (this.length > 0) {
			output.log();
			this.forEach((collection) => collection.writeTo(output));
		}

		// Validation was successful.
		if (this.errorCount === 0 && this.warningCount === 0) {
			output.success("Validation successful");
			return;
		}

		// Only errors.
		if (this.warningCount === 0) {
			output.error(`Failed with ${pluralize("error", this.errorCount)}`);
			return;
		}

		// Only warnings.
		if (this.errorCount === 0) {
			output.warn(pluralize("warning", this.warningCount));
			return;
		}

		// Both errors and warnings.
		output.error(`${pluralize("problem", this.errorCount + this.warningCount)} (${pluralize("error", this.errorCount)}, ${pluralize("warning", this.warningCount)})`);

		/**
		 * Pluralizes the {@link noun} based on the {@link count}.
		 * @param noun Noun to pluralize if required.
		 * @param count Count.
		 * @returns Pluralized or singular representation of the {@link noun}
		 */
		function pluralize(noun: string, count: number): string {
			return `${count} ${count === 1 ? noun : `${noun}s`}`;
		}
	}
}
