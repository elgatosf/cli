import { ValidationEntry, ValidationLevel, type ValidationEntryDetails } from "./entry";
import { ValidationResult } from "./result";
import { type ValidationRule } from "./rule";

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
export type Validator<TContext> = TContext & {
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
